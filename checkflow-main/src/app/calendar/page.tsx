'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/AuthProvider';
import { logAudit } from '@/lib/audit';
import {
  ChevronLeft, ChevronRight, Plus, X, Clock, MapPin,
  User, Pen, RefreshCw, Save, CalendarX,
} from 'lucide-react';

/* ─── constants ─────────────────────────────────────────────── */
const SESSION_TYPES = [
  'Recording Session','Mixing','Mastering','Vocal Booth','Band Rehearsal',
  'Podcast','Photography','Video Production','Interview',
];
const EVENT_TYPES = ['General','Meeting','Rehearsal','Maintenance','Blocked','Holiday','Other'];
const CANCEL_REASONS = [
  'Client No Show','Client Cancelled','Studio Unavailable','Emergency','Weather','Other',
];
const EVENT_COLORS: Record<string,string> = {
  General:'#8B5CF6', Meeting:'#06B6D4', Rehearsal:'#F59E0B',
  Maintenance:'#F87171', Blocked:'#4B5563', Holiday:'#10B981',
  Other:'#6B7280', Session:'#8B5CF6',
};
const STUDIO_COLORS: Record<string,string> = {
  'Studio A':'#8B5CF6', 'Studio B':'#06B6D4', Both:'#F59E0B',
};

/* ─── helpers ────────────────────────────────────────────────── */
const pad  = (n: number) => String(n).padStart(2,'0');
const daysInMonth = (y: number, m: number) => new Date(y, m+1, 0).getDate();
const firstDow    = (y: number, m: number) => new Date(y, m, 1).getDay();

function fmtTime(v: string|null|undefined) {
  if (!v) return '';
  const m = String(v).match(/[T ](\d{2}):(\d{2})/);
  if (!m) return '';
  let h = parseInt(m[1]); const min = m[2];
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12; if (h === 0) h = 12;
  return `${h}:${min} ${ampm}`;
}
function fmtDate(v: string|null|undefined) {
  if (!v) return '';
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  return new Date(+m[1], +m[2]-1, +m[3]).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
}
const isoDate  = (v: string|null|undefined) => v ? String(v).slice(0,10) : '';
const timeOnly = (v: string|null|undefined) => { const m=String(v||'').match(/[T ](\d{2}:\d{2})/); return m?m[1]:''; };
const isCancelled = (e: any) => !!e.cancelled_at || e.payment_status==='Cancelled';

/* ─── shared input styles ────────────────────────────────────── */
const INP: React.CSSProperties = {
  background:'#0F0A1E', border:'1px solid #2D1F4E', borderRadius:10,
  padding:'10px 12px', fontSize:14, color:'#E8ECF4', width:'100%',
  outline:'none', fontFamily:'inherit',
};
const INP_LG: React.CSSProperties = { ...INP, borderRadius:12, padding:'12px 14px', fontSize:16 };
const OVERLAY: React.CSSProperties = {
  position:'fixed', inset:0, background:'rgba(0,0,0,.85)', zIndex:300,
  display:'flex', alignItems:'center', justifyContent:'center', padding:24,
};
const NAV_BTN: React.CSSProperties = {
  width:32, height:32, background:'#1A1030', border:'1px solid #2D1F4E',
  borderRadius:8, color:'#9CA3AF', cursor:'pointer', display:'flex',
  alignItems:'center', justifyContent:'center',
};

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function CalendarPage() {
  const today   = new Date();
  const { user } = useAuth();
  const isOwner = user?.role === 'owner' || user?.role === 'executive_assistant' || (user as any)?.app_role === 'owner';

  /* navigation */
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  /* data */
  const [calEvents,  setCalEvents]  = useState<any[]>([]);
  const [sessions,   setSessions]   = useState<any[]>([]);
  const [employees,  setEmployees]  = useState<any[]>([]);
  const [syncing,    setSyncing]    = useState(false);
  const [lastSync,   setLastSync]   = useState<Date|null>(null);

  /* modals */
  const [popup,       setPopup]       = useState<{item:any;x:number;y:number}|null>(null);
  const [overflowDay, setOverflowDay] = useState<{date:string;items:any[]}|null>(null);
  const [editSession, setEditSession] = useState<any|null>(null);
  const [editForm,    setEditForm]    = useState<any>({});
  const [saving,      setSaving]      = useState(false);
  const [cancelCtx,   setCancelCtx]   = useState<{type:string;session:any}|null>(null);
  const [cancelReason,setCancelReason]= useState('Client Cancelled');
  const [cancelNotes, setCancelNotes] = useState('');
  const [reschedDate, setReschedDate] = useState('');
  const [reschedStart,setReschedStart]= useState('');
  const [reschedEnd,  setReschedEnd]  = useState('');
  const [reschedStudio, setReschedStudio] = useState<string>(''); // ✅ NEW: allow studio change
  const [actioning,   setActioning]   = useState(false);
  const [addOpen,     setAddOpen]     = useState(false);
  const [addForm,     setAddForm]     = useState({title:'',date:'',start_time:'',end_time:'',event_type:'General',studio:'N/A',assigned_to:'',description:''});
  const [adding,      setAdding]      = useState(false);

  const popupRef = useRef<HTMLDivElement>(null);

  /* ── fetch ───────────────────────────────────────────────── */
  const fetchMonth = useCallback(async (showSpinner = false) => {
    if (showSpinner) setSyncing(true);
    const y  = year, m = month;
    const d1 = `${y}-${pad(m+1)}-01`;
    const d2 = `${y}-${pad(m+1)}-${pad(daysInMonth(y,m))}`;

    // ✅ FIX 1: fetch both tables in one Promise.all (fast)
    // ✅ FIX 2: trim columns to only what we need (faster wire transfer)
    const [ceRes, sessRes, empRes] = await Promise.all([
      supabase
        .from('calendar_events')
        .select('id,title,date,start_time,end_time,event_type,studio,color,session_id,assigned_to,description')
        .gte('date', d1).lte('date', d2)
        .order('start_time'),
      supabase
        .from('sessions')
        .select('id,client_name,session_type,service,start_time,end_time,date,studio,payment_status,cancelled_at,cancellation_reason,employee_1_id,employee_2_id,notes')
        .gte('date', d1).lte('date', d2)
        .order('date'),
      supabase
        .from('employees')
        .select('id,name')
        .order('name'),
    ]);

    const ce   = ceRes.data   || [];
    const sess = sessRes.data || [];

    // FIX: Only show sessions that have NO calendar_event row (true orphans).
    // Sessions booked via /book already create a calendar_event — showing them
    // twice (once as a calendar_event + once as a raw session) is what causes
    // the "mixed together" appearance. The calendar_event row is the source of
    // truth for display. Raw sessions only appear here as a safety fallback.
    const linkedSessionIds = new Set(ce.map((e:any) => e.session_id).filter(Boolean));
    // Only show truly orphaned sessions (no calendar_event linked to them)
    const orphanSessions = sess.filter((s:any) =>
      !linkedSessionIds.has(s.id) &&
      s.payment_status !== 'Cancelled' &&
      s.payment_status !== 'Rescheduled'
    );

    setCalEvents(ce);
    setSessions(orphanSessions); // only sessions with NO linked calendar_event
    setEmployees(empRes.data || []);
    setLastSync(new Date());
    if (showSpinner) setSyncing(false);
  }, [year, month]);

  // initial + nav fetch
  useEffect(() => { fetchMonth(true); }, [fetchMonth]);

  // ✅ FIX: channel name already unique per year/month, but add cleanup guard
  useEffect(() => {
    let removed = false;
    const chan = supabase
      .channel(`calendar-${year}-${month}-${Date.now()}`)
      .on('postgres_changes', { event:'*', schema:'public', table:'calendar_events' }, () => { if (!removed) fetchMonth(); })
      .on('postgres_changes', { event:'*', schema:'public', table:'sessions' },        () => { if (!removed) fetchMonth(); })
      .subscribe();
    return () => { removed = true; supabase.removeChannel(chan); };
  }, [year, month, fetchMonth]);

  // close popup on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popup && popupRef.current && !popupRef.current.contains(e.target as Node))
        setPopup(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popup]);

  /* ── helpers ─────────────────────────────────────────────── */
  const empName = (id: string) => employees.find(e=>e.id===id)?.name || null;

  /** All display items for a given day number — deduplicated */
  function dayItems(day: number) {
    const dateStr = `${year}-${pad(month+1)}-${pad(day)}`;
    const evs = calEvents
      .filter(e => (e.date ? String(e.date).slice(0,10) : isoDate(e.start_time)) === dateStr)
      .map(e => ({
        ...e,
        // FIX: calendar_events linked to a session ARE bookings — treat them as sessions
        // so Edit/Reschedule/Cancel buttons appear in the popup
        _isSession: !!e.session_id,
        _color: e.color || (e.session_id ? (e.studio === 'Studio B' ? '#06B6D4' : '#8B5CF6') : EVENT_COLORS[e.event_type]) || '#8B5CF6',
        _label: e.title,
        // For edit form: extract client_name from title (format: "Client – Service")
        client_name: e.session_id ? (e.title || '').split(' – ')[0].replace(/^[🔄❌]\s*/,'').trim() : undefined,
        service: e.session_id ? (e.title || '').split(' – ').slice(1).join(' – ').trim() || e.event_type : undefined,
        // The session_id IS the sessions.id — use it for edits
        _session_id: e.session_id || null,
      }));
    const sess = sessions
      .filter(s => (s.date ? String(s.date).slice(0,10) : isoDate(s.start_time)) === dateStr)
      .map(s => ({ ...s, _isSession:true, _color: STUDIO_COLORS[s.studio] || '#8B5CF6', _label: s.client_name }));
    return [...evs, ...sess];
  }

  /* ── add event ───────────────────────────────────────────── */
  async function handleAdd() {
    if (!addForm.title.trim() || !addForm.date || !addForm.start_time) return;
    setAdding(true);
    const start = `${addForm.date}T${addForm.start_time}:00`;
    const end   = addForm.end_time ? `${addForm.date}T${addForm.end_time}:00` : start;
    const { error } = await supabase.from('calendar_events').insert({
      title: addForm.title.trim(), description: addForm.description,
      start_time: start, end_time: end, event_type: addForm.event_type,
      studio: addForm.studio || 'N/A', assigned_to: addForm.assigned_to || null,
      color: EVENT_COLORS[addForm.event_type] || '#8B5CF6', date: addForm.date,
    });
    if (error) { alert('Error: '+error.message); setAdding(false); return; }
    setAddForm({title:'',date:'',start_time:'',end_time:'',event_type:'General',studio:'N/A',assigned_to:'',description:''});
    setAddOpen(false); setAdding(false);
    // realtime will trigger fetchMonth automatically
  }

  /* ── edit session ────────────────────────────────────────── */
  function openEdit(item: any) {
    setPopup(null); setOverflowDay(null);
    // FIX: If this item came from calEvents (has _session_id), the sessions.id
    // is _session_id — not item.id (which is the calendar_events.id).
    // handleSaveEdit updates sessions WHERE id = editForm.id, so we must pass
    // the session's UUID, not the calendar_event's UUID.
    const sessionId = item._session_id || item.id;
    const clientName = item.client_name || (item.title || '').split(' – ')[0].replace(/^[🔄❌]\s*/,'').trim() || '';
    const service = item.service || item.session_type || (item.title || '').split(' – ').slice(1).join(' – ').trim() || 'Recording Session';
    setEditForm({
      id: sessionId,
      client_name: clientName,
      service,
      studio: item.studio || 'Studio A',
      date: item.date ? String(item.date).slice(0,10) : isoDate(item.start_time||''),
      start_time: timeOnly(item.start_time||''), end_time: timeOnly(item.end_time||''),
      employee_1_id: item.employee_1_id || '', employee_2_id: item.employee_2_id || '',
      notes: item.notes || '',
    });
    setEditSession(item);
  }

  async function handleSaveEdit() {
    if (!editForm.date || !editForm.start_time) return;
    setSaving(true);
    try {
      const start = `${editForm.date}T${editForm.start_time}:00`;
      const end   = editForm.end_time ? `${editForm.date}T${editForm.end_time}:00` : start;
      const { error: e1 } = await supabase.from('sessions').update({
        service: editForm.service, session_type: editForm.service,
        studio: editForm.studio, date: editForm.date,
        start_time: start, end_time: end,
        employee_1_id: editForm.employee_1_id || null,
        employee_2_id: editForm.employee_2_id || null,
        notes: editForm.notes, updated_at: new Date().toISOString(),
      }).eq('id', editForm.id);
      if (e1) throw e1;
      await supabase.from('calendar_events').update({
        title: `${editForm.client_name} – ${editForm.service}`,
        start_time: start, end_time: end, studio: editForm.studio, date: editForm.date,
        color: editForm.studio === 'Studio A' ? '#8B5CF6' : '#06B6D4',
        assigned_to: editForm.employee_1_id || null, description: editForm.notes,
      }).eq('session_id', editForm.id);
      await logAudit({ actor_username: user?.username||'system', actor_role: user?.role||'owner',
        action:'UPDATE', category:'session', target_type:'session', target_name: editForm.client_name,
        detail: `Updated: ${editForm.service} in ${editForm.studio} on ${editForm.date}` });
      setEditSession(null);
      // realtime will auto-refresh
    } catch(e: any) { alert('Error: '+(e.message||e)); }
    finally { setSaving(false); }
  }

  /* ── cancel / reschedule ─────────────────────────────────── */
  function openAction(type: string, item: any) {
    setPopup(null); setOverflowDay(null);
    setCancelReason('Client Cancelled'); setCancelNotes('');
    setReschedDate(''); setReschedStart(timeOnly(item.start_time||'')); setReschedEnd(timeOnly(item.end_time||''));
    setReschedStudio(item.studio || 'Studio A');
    // FIX: if item came from calEvents, _session_id is the real sessions.id
    const sessionId = item._session_id || item.id;
    const clientName = item.client_name || (item.title||'').split(' – ')[0].trim() || '';
    const service = item.service || item.session_type || (item.title||'').split(' – ').slice(1).join(' – ').trim() || '';
    setCancelCtx({ type, session: { ...item, id: sessionId, client_name: clientName, service } });
  }

  async function handleCancel() {
    if (!cancelCtx) return; setActioning(true);
    const s = cancelCtx.session;
    try {
      await supabase.from('sessions').update({
        payment_status:'Cancelled', cancelled_at: new Date().toISOString(),
        cancellation_reason: cancelReason,
        notes: [s.notes, `CANCELLED: ${cancelReason}${cancelNotes?` — ${cancelNotes}`:''}`].filter(Boolean).join('\n'),
        updated_at: new Date().toISOString(),
      }).eq('id', s.id);
      await supabase.from('calendar_events').update({
        title: `❌ ${s.client_name} – ${s.service||s.session_type} (Cancelled)`,
        color: '#4B5563', description: `Cancelled: ${cancelReason}${cancelNotes?` — ${cancelNotes}`:''}`,
      }).eq('session_id', s.id);
      await logAudit({ actor_username: user?.username||'system', actor_role: user?.role||'owner',
        action:'CANCEL', category:'session', target_type:'session', target_name: s.client_name,
        detail: `Cancelled: ${cancelReason}` });
      setCancelCtx(null);
    } catch(e:any) { alert('Error: '+(e.message||e)); }
    finally { setActioning(false); }
  }

  async function handleReschedule() {
    if (!cancelCtx || !reschedDate || !reschedStart) return; setActioning(true);
    const s = cancelCtx.session;
    try {
      const start = `${reschedDate}T${reschedStart}:00`;
      const end   = reschedEnd ? `${reschedDate}T${reschedEnd}:00` : start;
      const newStudio = reschedStudio || s.studio; // ✅ use selected studio, fallback to original
      await supabase.from('sessions').update({
        date: reschedDate, start_time: start, end_time: end,
        studio: newStudio, // ✅ allow studio change on reschedule
        payment_status: 'Rescheduled',
        notes: [s.notes, `RESCHEDULED to ${reschedDate} at ${reschedStart} in ${newStudio} by ${user?.username||'system'}`].filter(Boolean).join('\n'),
        updated_at: new Date().toISOString(),
      }).eq('id', s.id);
      await supabase.from('calendar_events').update({
        title: `🔄 ${s.client_name} – ${s.service||s.session_type}`,
        start_time: start, end_time: end, date: reschedDate,
        studio: newStudio, // ✅ update calendar event studio too
        color: newStudio==='Studio A' ? '#8B5CF6' : '#06B6D4',
        description: `Rescheduled from ${isoDate(s.start_time||'')} · ${s.studio} → ${newStudio}`,
      }).eq('session_id', s.id);
      await logAudit({ actor_username: user?.username||'system', actor_role: user?.role||'owner',
        action:'RESCHEDULE', category:'session', target_type:'session', target_name: s.client_name,
        detail: `Rescheduled to ${reschedDate} at ${reschedStart}` });
      setCancelCtx(null);
    } catch(e:any) { alert('Error: '+(e.message||e)); }
    finally { setActioning(false); }
  }

  async function deleteCalEvent(id: string) {
    await supabase.from('calendar_events').delete().eq('id', id);
    setPopup(null);
    // realtime auto-refreshes
  }

  /* ── render helpers ──────────────────────────────────────── */
  const monthName = new Date(year, month).toLocaleString('default',{month:'long'});

  function PopupActions({ item }: { item: any }) {
    if (!item._isSession || !isOwner || isCancelled(item)) return null;
    return (
      <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:6}}>
        <button onClick={()=>openEdit(item)} style={{width:'100%',padding:'7px',background:'rgba(139,92,246,.12)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.3)',borderRadius:8,fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:5,fontWeight:600}}>
          <Pen size={11}/> Edit Booking
        </button>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
          <button onClick={()=>openAction('reschedule',item)} style={{padding:'7px',background:'rgba(6,182,212,.1)',color:'#22D3EE',border:'1px solid rgba(6,182,212,.25)',borderRadius:8,fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:4,fontWeight:600}}>
            <RefreshCw size={10}/> Reschedule
          </button>
          <button onClick={()=>openAction('cancel',item)} style={{padding:'7px',background:'rgba(239,68,68,.1)',color:'#F87171',border:'1px solid rgba(239,68,68,.25)',borderRadius:8,fontSize:11,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:4,fontWeight:600}}>
            <CalendarX size={10}/> Cancel
          </button>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     JSX
  ════════════════════════════════════════════════════════════ */
  return (
    <div style={{padding:'16px 14px',display:'flex',flexDirection:'column',height:'calc(100dvh - 60px)',overflow:'hidden',position:'relative'}}>

      {/* header */}
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12,flexWrap:'wrap',gap:10,flexShrink:0}}>
        <div>
          <div className="page-badge" style={{background:'rgba(139,92,246,.15)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.3)'}}>CALENDAR</div>
          <h1 style={{fontSize:24,fontWeight:700}}>Studio Calendar</h1>
        </div>
        <button onClick={()=>{setAddForm({title:'',date:'',start_time:'',end_time:'',event_type:'General',studio:'N/A',assigned_to:'',description:''});setAddOpen(true);}} className="btn btn-primary">
          <Plus size={13}/> Add Booking
        </button>
      </div>

      {/* nav bar */}
      <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10,flexShrink:0,flexWrap:'wrap'}}>
        <button onClick={()=>month===0?(setMonth(11),setYear(y=>y-1)):setMonth(m=>m-1)} style={NAV_BTN}><ChevronLeft size={15}/></button>
        <span style={{fontSize:18,fontWeight:700,minWidth:150,textAlign:'center'}}>{monthName} {year}</span>
        <button onClick={()=>month===11?(setMonth(0),setYear(y=>y+1)):setMonth(m=>m+1)} style={NAV_BTN}><ChevronRight size={15}/></button>
        <button onClick={()=>{setMonth(today.getMonth());setYear(today.getFullYear());}} style={{padding:'5px 12px',background:'rgba(139,92,246,.12)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.3)',borderRadius:8,fontSize:12,cursor:'pointer'}}>Today</button>

        {/* ✅ sync status indicator */}
        <button onClick={()=>fetchMonth(true)} style={{display:'flex',alignItems:'center',gap:5,padding:'5px 10px',background:syncing?'rgba(34,211,238,.1)':'rgba(16,185,129,.08)',color:syncing?'#22D3EE':'#34D399',border:`1px solid ${syncing?'rgba(34,211,238,.3)':'rgba(16,185,129,.2)'}`,borderRadius:8,fontSize:11,cursor:'pointer',transition:'all .2s'}}>
          <RefreshCw size={11} style={{animation:syncing?'spin 1s linear infinite':undefined}}/> 
          {syncing ? 'Syncing…' : lastSync ? `Synced ${lastSync.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}` : 'Sync'}
        </button>

        <span style={{fontSize:12,color:'#4B5563',marginLeft:4}}>{sessions.length + calEvents.filter(e=>e.session_id).length} sessions · {calEvents.filter(e=>!e.session_id).length} events</span>
      </div>

      {/* calendar grid */}
      <div style={{background:'#1A1030',border:'1px solid #2D1F4E',borderRadius:14,overflow:'hidden',flex:1,display:'flex',flexDirection:'column'}}>
        {/* day headers */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'1px solid #2D1F4E',flexShrink:0}}>
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>(
            <div key={d} style={{padding:'10px 0',textAlign:'center',fontSize:11,fontWeight:600,color:'#4B5563',letterSpacing:'.06em'}}>{d}</div>
          ))}
        </div>

        {/* cells */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',flex:1,overflowY:'auto'}}>
          {/* empty leading cells */}
          {Array.from({length:firstDow(year,month)}).map((_,i)=>(
            <div key={`p${i}`} style={{borderRight:'1px solid #1A1F38',borderBottom:'1px solid #1A1F38',background:'rgba(0,0,0,.15)',minHeight:90}}/>
          ))}

          {/* day cells */}
          {Array.from({length:daysInMonth(year,month)}).map((_,idx)=>{
            const day = idx+1;
            const dateStr = `${year}-${pad(month+1)}-${pad(day)}`;
            const isToday = day===today.getDate() && month===today.getMonth() && year===today.getFullYear();
            const items = dayItems(day);
            const visible = items.slice(0,3);
            const extra   = items.length - 3;

            return (
              <div key={day}
                onClick={()=>{setAddForm(f=>({...f,date:dateStr}));setAddOpen(true);}}
                style={{borderRight:'1px solid #1A1F38',borderBottom:'1px solid #1A1F38',padding:5,cursor:'pointer',minHeight:90,transition:'background .1s'}}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(139,92,246,.04)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >
                <div style={{fontSize:12,fontWeight:isToday?700:400,color:isToday?'#EAB308':'#6B7280',width:22,height:22,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:isToday?'rgba(234,179,8,.15)':'transparent',marginBottom:3}}>
                  {day}
                </div>

                {visible.map((item,i)=>(
                  <div key={i}
                    onClick={e=>{
                      e.stopPropagation();
                      const r = e.currentTarget.getBoundingClientRect();
                      setPopup({item, x:Math.min(r.left, window.innerWidth-300), y:Math.min(r.bottom+8, window.innerHeight-340)});
                    }}
                    style={{fontSize:10,padding:'2px 5px',borderRadius:4,background:`${item._color}25`,color:item._color,border:`1px solid ${item._color}55`,marginBottom:2,display:'flex',alignItems:'center',gap:3,overflow:'hidden',cursor:'pointer',opacity:isCancelled(item)?.4:1}}
                    onMouseEnter={e=>e.currentTarget.style.opacity='0.7'}
                    onMouseLeave={e=>e.currentTarget.style.opacity=isCancelled(item)?'0.4':'1'}
                  >
                    {item._isSession && <div style={{width:5,height:5,borderRadius:'50%',background:item._color,flexShrink:0}}/>}
                    <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>{item._label}</span>
                    {!item._isSession && (
                      <button onClick={ev=>{ev.stopPropagation();deleteCalEvent(item.id);}} style={{background:'rgba(239,68,68,.25)',border:'none',borderRadius:3,color:'#F87171',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',width:12,height:12,flexShrink:0,padding:0}}>
                        <X size={8}/>
                      </button>
                    )}
                  </div>
                ))}

                {extra > 0 && (
                  <button
                    onClick={e=>{e.stopPropagation();setOverflowDay({date:dateStr,items});}}
                    style={{fontSize:9,color:'#A78BFA',background:'rgba(139,92,246,.1)',border:'1px solid rgba(139,92,246,.2)',borderRadius:4,padding:'1px 5px',cursor:'pointer',width:'100%',textAlign:'left',marginTop:1}}
                  >+{extra} more booking{extra!==1?'s':''}</button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── popup ─────────────────────────────────────────────── */}
      {popup && (
        <div ref={popupRef} style={{position:'fixed',left:popup.x,top:popup.y,width:284,background:'#1A1030',border:`2px solid ${popup.item._color}66`,borderRadius:14,boxShadow:'0 8px 32px rgba(0,0,0,.6)',zIndex:200,padding:16}}>
          <div style={{position:'absolute',top:0,left:0,right:0,height:3,background:popup.item._color,borderRadius:'14px 14px 0 0'}}/>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10,marginTop:4}}>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,color:'#E8ECF4',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{popup.item._label||popup.item.title}</div>
              <div style={{fontSize:11,color:popup.item._color,marginTop:2,fontWeight:600}}>
                {popup.item._isSession ? popup.item.service||popup.item.session_type : popup.item.event_type}
                {isCancelled(popup.item) && <span style={{marginLeft:6,color:'#F87171'}}>· Cancelled</span>}
              </div>
            </div>
            <button onClick={()=>setPopup(null)} style={{background:'none',border:'none',color:'#4B5563',cursor:'pointer',padding:2,flexShrink:0,marginLeft:8}}><X size={14}/></button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:7}}>
            <div style={{display:'flex',alignItems:'center',gap:7}}>
              <Clock size={12} style={{color:'#6B7280'}}/>
              <span style={{fontSize:12,color:'#D1D5DB'}}>
                {fmtDate(popup.item.start_time||popup.item.date)}
                {popup.item.start_time ? ` · ${fmtTime(popup.item.start_time)}` : ''}
                {popup.item.end_time && popup.item.end_time!==popup.item.start_time ? ` → ${fmtTime(popup.item.end_time)}` : ''}
              </span>
            </div>
            {popup.item.studio && popup.item.studio!=='N/A' && (
              <div style={{display:'flex',alignItems:'center',gap:7}}>
                <MapPin size={12} style={{color:'#6B7280'}}/>
                <span style={{fontSize:12,color:'#D1D5DB'}}>{popup.item.studio}</span>
                <span style={{fontSize:10,padding:'1px 6px',borderRadius:4,background:`${STUDIO_COLORS[popup.item.studio]||'#6B7280'}22`,color:STUDIO_COLORS[popup.item.studio]||'#6B7280',border:`1px solid ${STUDIO_COLORS[popup.item.studio]||'#6B7280'}44`,fontWeight:600}}>{popup.item.studio}</span>
              </div>
            )}
            {popup.item._isSession && popup.item.employee_1_id && (
              <div style={{display:'flex',alignItems:'center',gap:7}}>
                <User size={12} style={{color:'#6B7280'}}/>
                <span style={{fontSize:12,color:'#D1D5DB'}}>{empName(popup.item.employee_1_id)||'—'}</span>
              </div>
            )}
          </div>
          <PopupActions item={popup.item}/>
        </div>
      )}

      {/* ── overflow day modal ─────────────────────────────────── */}
      {overflowDay && (
        <div style={OVERLAY} onClick={()=>setOverflowDay(null)}>
          <div className="card" style={{padding:24,width:'100%',maxWidth:480,maxHeight:'80vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <h3 style={{fontSize:15,fontWeight:700,color:'#E8ECF4'}}>{fmtDate(overflowDay.date)} — {overflowDay.items.length} booking{overflowDay.items.length!==1?'s':''}</h3>
              <button onClick={()=>setOverflowDay(null)} style={{background:'none',border:'none',color:'#6B7280',cursor:'pointer'}}><X size={18}/></button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {overflowDay.items.map((item,i)=>(
                <div key={i} style={{padding:'12px 14px',background:'#0F0A1E',border:`1px solid ${item._color}44`,borderRadius:10,borderLeft:`3px solid ${item._color}`,opacity:isCancelled(item)?.5:1}}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:8}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:'#E8ECF4'}}>
                        {item._label}
                        {isCancelled(item) && <span style={{marginLeft:6,fontSize:10,color:'#F87171'}}>Cancelled</span>}
                      </div>
                      <div style={{fontSize:11,color:item._color,marginTop:1}}>{item._isSession?item.service||item.session_type:item.event_type}</div>
                      <div style={{fontSize:11,color:'#6B7280',marginTop:3,display:'flex',gap:10,flexWrap:'wrap'}}>
                        {item.start_time && <span>🕐 {fmtTime(item.start_time)}{item.end_time&&item.end_time!==item.start_time?` → ${fmtTime(item.end_time)}`:''}</span>}
                        {item.studio && item.studio!=='N/A' && <span>📍 {item.studio}</span>}
                        {item._isSession && item.employee_1_id && <span>👤 {empName(item.employee_1_id)}</span>}
                      </div>
                    </div>
                    {item._isSession && isOwner && !isCancelled(item) && (
                      <div style={{display:'flex',gap:4,flexShrink:0}}>
                        <button onClick={()=>openEdit(item)} style={{padding:'4px 7px',background:'rgba(139,92,246,.15)',color:'#A78BFA',border:'1px solid rgba(139,92,246,.3)',borderRadius:6,fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',gap:3}}>
                          <Pen size={10}/> Edit
                        </button>
                        <button onClick={()=>openAction('reschedule',item)} style={{padding:'4px 7px',background:'rgba(6,182,212,.1)',color:'#22D3EE',border:'1px solid rgba(6,182,212,.25)',borderRadius:6,fontSize:10,cursor:'pointer'}}><RefreshCw size={10}/></button>
                        <button onClick={()=>openAction('cancel',item)} style={{padding:'4px 7px',background:'rgba(239,68,68,.1)',color:'#F87171',border:'1px solid rgba(239,68,68,.25)',borderRadius:6,fontSize:10,cursor:'pointer'}}><CalendarX size={10}/></button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── edit session modal ────────────────────────────────── */}
      {editSession && (
        <div style={OVERLAY} onClick={()=>setEditSession(null)}>
          <div className="card" style={{padding:24,width:'100%',maxWidth:560,maxHeight:'90vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <div>
                <h3 style={{fontSize:16,fontWeight:700,color:'#A78BFA'}}>Edit Booking</h3>
                <p style={{fontSize:12,color:'#6B7280',marginTop:2}}>{editForm.client_name}</p>
              </div>
              <button onClick={()=>setEditSession(null)} style={{background:'none',border:'none',color:'#6B7280',cursor:'pointer'}}><X size={18}/></button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div>
                <label className="label">Service</label>
                <select style={INP} value={editForm.service} onChange={e=>setEditForm((f:any)=>({...f,service:e.target.value}))}>
                  {SESSION_TYPES.map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Studio</label>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {['Studio A','Studio B'].map(s=>{
                    const active = editForm.studio===s;
                    const c = s==='Studio A'?'#8B5CF6':'#06B6D4';
                    return <button key={s} type="button" onClick={()=>setEditForm((f:any)=>({...f,studio:s}))} style={{padding:10,borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',border:`2px solid ${active?c:'#2D1F4E'}`,background:active?`${c}22`:'#0F0A1E',color:active?c:'#6B7280'}}>{s}</button>;
                  })}
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                <div><label className="label">Date</label><input style={INP} type="date" value={editForm.date} onChange={e=>setEditForm((f:any)=>({...f,date:e.target.value}))}/></div>
                <div><label className="label">Start</label><input style={INP} type="time" value={editForm.start_time} onChange={e=>setEditForm((f:any)=>({...f,start_time:e.target.value}))}/></div>
                <div><label className="label">End</label><input style={INP} type="time" value={editForm.end_time} onChange={e=>setEditForm((f:any)=>({...f,end_time:e.target.value}))}/></div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div>
                  <label className="label">Engineer</label>
                  <select style={INP} value={editForm.employee_1_id} onChange={e=>setEditForm((f:any)=>({...f,employee_1_id:e.target.value}))}>
                    <option value="">— None —</option>
                    {employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Employee 2</label>
                  <select style={INP} value={editForm.employee_2_id} onChange={e=>setEditForm((f:any)=>({...f,employee_2_id:e.target.value}))}>
                    <option value="">— None —</option>
                    {employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea rows={2} style={{...INP,resize:'vertical'}} value={editForm.notes} onChange={e=>setEditForm((f:any)=>({...f,notes:e.target.value}))}/>
              </div>
            </div>
            <div style={{display:'flex',gap:8,marginTop:16}}>
              <button onClick={handleSaveEdit} disabled={saving||!editForm.date||!editForm.start_time} className="btn btn-primary" style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                <Save size={13}/>{saving?'Saving…':'Save Changes'}
              </button>
              <button onClick={()=>setEditSession(null)} className="btn btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── cancel modal ──────────────────────────────────────── */}
      {cancelCtx?.type==='cancel' && (
        <div style={OVERLAY} onClick={()=>setCancelCtx(null)}>
          <div className="card" style={{padding:24,width:'100%',maxWidth:440}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <div>
                <h3 style={{fontSize:16,fontWeight:700,color:'#F87171'}}>Cancel Booking</h3>
                <p style={{fontSize:12,color:'#6B7280',marginTop:2}}>{cancelCtx.session.client_name}</p>
              </div>
              <button onClick={()=>setCancelCtx(null)} style={{background:'none',border:'none',color:'#6B7280',cursor:'pointer'}}><X size={18}/></button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <label className="label">Reason</label>
                <select style={INP} value={cancelReason} onChange={e=>setCancelReason(e.target.value)}>
                  {CANCEL_REASONS.map(r=><option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Notes (optional)</label>
                <textarea rows={2} style={{...INP,resize:'vertical'}} value={cancelNotes} onChange={e=>setCancelNotes(e.target.value)}/>
              </div>
              <div style={{padding:'10px 12px',background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.2)',borderRadius:8,fontSize:12,color:'#FCA5A5'}}>
                ⚠️ Marks booking as Cancelled and updates the calendar. This is logged.
              </div>
            </div>
            <div style={{display:'flex',gap:8,marginTop:16}}>
              <button onClick={handleCancel} disabled={actioning} style={{flex:1,padding:'10px',background:'rgba(239,68,68,.15)',color:'#F87171',border:'1px solid rgba(239,68,68,.35)',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                <CalendarX size={13}/>{actioning?'Cancelling…':'Confirm Cancellation'}
              </button>
              <button onClick={()=>setCancelCtx(null)} className="btn btn-ghost">Back</button>
            </div>
          </div>
        </div>
      )}

      {/* ── reschedule modal ──────────────────────────────────── */}
      {cancelCtx?.type==='reschedule' && (
        <div style={OVERLAY} onClick={()=>setCancelCtx(null)}>
          <div className="card" style={{padding:24,width:'100%',maxWidth:440}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <div>
                <h3 style={{fontSize:16,fontWeight:700,color:'#22D3EE'}}>Reschedule Booking</h3>
                <p style={{fontSize:12,color:'#6B7280',marginTop:2}}>{cancelCtx.session.client_name}</p>
              </div>
              <button onClick={()=>setCancelCtx(null)} style={{background:'none',border:'none',color:'#6B7280',cursor:'pointer'}}><X size={18}/></button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{padding:'8px 12px',background:'rgba(6,182,212,.06)',border:'1px solid rgba(6,182,212,.15)',borderRadius:8,fontSize:11,color:'#6B7280'}}>
                Current: {fmtDate(cancelCtx.session.start_time||cancelCtx.session.date)} · {fmtTime(cancelCtx.session.start_time||'')} · {cancelCtx.session.studio}
              </div>
              {/* ✅ Studio selector — allows moving to a different studio */}
              <div>
                <label className="label">Studio</label>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {(['Studio A','Studio B'] as const).map(s => {
                    const active = reschedStudio === s;
                    const c = s === 'Studio A' ? '#8B5CF6' : '#06B6D4';
                    return <button key={s} type="button" onClick={() => setReschedStudio(s)} style={{padding:10,borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',border:`2px solid ${active?c:'#2D1F4E'}`,background:active?`${c}22`:'#0F0A1E',color:active?c:'#6B7280'}}>{s}</button>;
                  })}
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:10}}>
                <div><label className="label">New Date *</label><input style={INP} type="date" value={reschedDate} onChange={e=>setReschedDate(e.target.value)}/></div>
                <div><label className="label">Start *</label><input style={INP} type="time" value={reschedStart} onChange={e=>setReschedStart(e.target.value)}/></div>
                <div><label className="label">End</label><input style={INP} type="time" value={reschedEnd} onChange={e=>setReschedEnd(e.target.value)}/></div>
              </div>
            </div>
            <div style={{display:'flex',gap:8,marginTop:16}}>
              <button onClick={handleReschedule} disabled={actioning||!reschedDate||!reschedStart} style={{flex:1,padding:'10px',background:'rgba(6,182,212,.12)',color:'#22D3EE',border:'1px solid rgba(6,182,212,.3)',borderRadius:10,fontSize:13,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
                <RefreshCw size={13}/>{actioning?'Rescheduling…':'Confirm Reschedule'}
              </button>
              <button onClick={()=>setCancelCtx(null)} className="btn btn-ghost">Back</button>
            </div>
          </div>
        </div>
      )}

      {/* ── add booking modal ─────────────────────────────────── */}
      {addOpen && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.75)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:24}} onClick={()=>setAddOpen(false)}>
          <div className="card" style={{padding:24,width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
              <h3 style={{fontSize:16,fontWeight:700,color:'#EAB308'}}>{addForm.date?`Add Booking — ${addForm.date}`:'Add Booking'}</h3>
              <button onClick={()=>setAddOpen(false)} style={{background:'none',border:'none',color:'#6B7280',cursor:'pointer'}}><X size={18}/></button>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <label className="label">Title *</label>
                <input style={INP_LG} placeholder="Event title" value={addForm.title} onChange={e=>setAddForm(f=>({...f,title:e.target.value}))} autoFocus/>
              </div>
              <div className="g2">
                <div><label className="label">Date *</label><input style={INP_LG} type="date" value={addForm.date} onChange={e=>setAddForm(f=>({...f,date:e.target.value}))}/></div>
                <div><label className="label">Type</label>
                  <select style={INP_LG} value={addForm.event_type} onChange={e=>setAddForm(f=>({...f,event_type:e.target.value}))}>
                    {EVENT_TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="label">Start Time</label><input style={INP_LG} type="time" value={addForm.start_time} onChange={e=>setAddForm(f=>({...f,start_time:e.target.value}))}/></div>
                <div><label className="label">End Time</label><input style={INP_LG} type="time" value={addForm.end_time} onChange={e=>setAddForm(f=>({...f,end_time:e.target.value}))}/></div>
                <div><label className="label">Studio</label>
                  <select style={INP_LG} value={addForm.studio} onChange={e=>setAddForm(f=>({...f,studio:e.target.value}))}>
                    {['N/A','Studio A','Studio B','Both'].map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div><label className="label">Assign To</label>
                  <select style={INP_LG} value={addForm.assigned_to} onChange={e=>setAddForm(f=>({...f,assigned_to:e.target.value}))}>
                    <option value="">— None —</option>
                    {employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={{display:'flex',gap:8,marginTop:16}}>
              <button onClick={handleAdd} disabled={adding||!addForm.title.trim()||!addForm.date} className="btn btn-primary" style={{flex:1}}>
                {adding?'Saving…':'+ Save Booking'}
              </button>
              <button onClick={()=>setAddOpen(false)} className="btn btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* spin keyframe */}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
