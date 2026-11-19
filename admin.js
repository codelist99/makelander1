const loginPanel=document.getElementById('loginPanel');
const dashboard=document.getElementById('dashboard');
const loginError=document.getElementById('loginError');
const dashboardError=document.getElementById('dashboardError');
let currentLeads=[];

async function loadDashboard(password){
  const response=await fetch('/api/stats',{headers:{Authorization:`Bearer ${password}`},cache:'no-store'});
  const payload=await response.json();
  if(!response.ok)throw new Error(payload.error||'Unable to load dashboard');
  sessionStorage.setItem('makeAdminPassword',password);
  loginPanel.hidden=true;
  dashboard.hidden=false;
  dashboardError.textContent='';
  document.getElementById('totalClicks').textContent=payload.totals.clicks.toLocaleString();
  document.getElementById('leanClicks').textContent=payload.totals.lean.toLocaleString();
  document.getElementById('fitClicks').textContent=payload.totals.fit.toLocaleString();
  document.getElementById('make3Clicks').textContent=payload.totals.make3.toLocaleString();
  document.getElementById('totalLeads').textContent=payload.totals.leads.toLocaleString();
  document.getElementById('updatedAt').textContent=`Updated ${new Date().toLocaleString()}`;
  renderDaily(payload.daily);
  renderLeads(payload.leads);
}

function renderDaily(days){
  const chart=document.getElementById('dailyChart');
  chart.replaceChildren();
  const max=Math.max(1,...days.map(day=>Math.max(day.clicks,day.leads)));
  days.forEach(day=>{
    const bar=document.createElement('div');
    bar.className=`day-bar${day.leads?' lead-day':''}`;
    bar.style.height=`${Math.max(day.clicks?4:0,(day.clicks/max)*100)}%`;
    bar.style.setProperty('--lead-height',`${(day.leads/max)*200}px`);
    bar.dataset.label=`${day.day}: ${day.clicks} clicks, ${day.leads} leads`;
    chart.appendChild(bar);
  });
}

function renderLeads(leads){
  currentLeads=leads;
  const rows=document.getElementById('leadRows');
  rows.replaceChildren();
  document.getElementById('emptyLeads').hidden=leads.length>0;
  leads.forEach(lead=>{
    const row=document.createElement('tr');
    [new Date(lead.submittedAt).toLocaleString(),`${lead.firstName} ${lead.lastName}`,lead.email,lead.phone||'—',lead.consent?'Yes':'No'].forEach(value=>{
      const cell=document.createElement('td');cell.textContent=value;row.appendChild(cell);
    });
    rows.appendChild(row);
  });
}

document.getElementById('loginForm').addEventListener('submit',async event=>{
  event.preventDefault();loginError.textContent='';
  try{await loadDashboard(document.getElementById('password').value)}catch(error){loginError.textContent=error.message}
});
document.getElementById('refreshButton').addEventListener('click',()=>loadDashboard(sessionStorage.getItem('makeAdminPassword')).catch(error=>dashboardError.textContent=error.message));
document.getElementById('logoutButton').addEventListener('click',()=>{sessionStorage.removeItem('makeAdminPassword');location.reload()});
document.getElementById('exportButton').addEventListener('click',()=>{
  const quote=value=>`"${String(value??'').replaceAll('"','""')}"`;
  const rows=[['Submitted','First name','Last name','Email','Phone','Consent'],...currentLeads.map(lead=>[lead.submittedAt,lead.firstName,lead.lastName,lead.email,lead.phone,lead.consent?'Yes':'No'])];
  const blob=new Blob([rows.map(row=>row.map(quote).join(',')).join('\r\n')],{type:'text/csv'});
  const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`make-leads-${new Date().toISOString().slice(0,10)}.csv`;link.click();URL.revokeObjectURL(link.href);
});

const savedPassword=sessionStorage.getItem('makeAdminPassword');
if(savedPassword)loadDashboard(savedPassword).catch(()=>sessionStorage.removeItem('makeAdminPassword'));
