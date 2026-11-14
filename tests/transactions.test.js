const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function extract(name){const start=script.indexOf('function '+name+'(');if(start<0)throw Error('Missing '+name);let next=script.indexOf('\nfunction ',start+10);if(next<0)next=script.indexOf('\nconst ',start+10);return script.slice(start,next<0?undefined:next);}
const ctx={state:{debts:[{id:'d1',type:'owed',name:'دين 1',total:1000},{id:'d2',type:'owed',name:'دين 2',total:2000}],paymentGroups:[{id:'p1',type:'owed',amount:300,allocations:[{debtId:'d1',amount:100},{debtId:'d2',amount:200}],linkedExpenseId:'e1',linkedMoveId:''}],expenses:[{id:'e1',amount:300}],moneyMoves:[],wallets:[{id:'w',openingBalance:0}],salaryPeriod:'monthly'},
 confirmModal:(a,b,cb)=>cb(),save:()=>{},renderAll:()=>{},toast:()=>{},validNum:(v,d=0)=>Number.isFinite(Number(v))?Number(v):d,monthKey:d=>String(d).slice(0,7),
 walletBalance:w=>w.openingBalance+ctx.state.moneyMoves.filter(m=>m.toWalletId===w.id).reduce((a,m)=>a+m.amount,0)-ctx.state.expenses.filter(e=>e.walletId===w.id).reduce((a,e)=>a+e.amount,0)-ctx.state.moneyMoves.filter(m=>m.fromWalletId===w.id&&m.type==='transfer').reduce((a,m)=>a+m.amount,0)};
vm.createContext(ctx);vm.runInContext(extract('deleteDebt')+'\n'+extract('deleteSalaryReceipt')+'\n'+extract('deleteCommitment'),ctx);
ctx.deleteDebt('d1');
const g=ctx.state.paymentGroups[0];if(!g||g.amount!==200||g.allocations.length!==1||g.allocations[0].debtId!=='d2')throw Error('Mixed debt deletion did not preserve remaining allocation');
if(ctx.state.expenses[0].amount!==200)throw Error('Linked expense was not reduced to remaining debt allocation');
ctx.state.moneyMoves=[{id:'s1',type:'salary',date:'2026-11-01',amount:1000,toWalletId:'w'}];ctx.state.expenses=[{id:'spent',walletId:'w',amount:800}];
ctx.deleteSalaryReceipt('s1');if(!ctx.state.moneyMoves.some(m=>m.id==='s1'))throw Error('Salary cancellation should be blocked when it would make wallet negative');
ctx.state.commitments=[{id:'c1',name:'إيجار'}];ctx.state.expenses=[{id:'rent-payment',commitmentId:'c1',commitmentAutoCreated:true,amount:500,walletId:'w'}];ctx.deleteCommitment('c1');if(ctx.state.expenses.length!==1||ctx.state.expenses[0].commitmentId!==null||ctx.state.expenses[0].amount!==500)throw Error('Deleting a commitment must preserve historical paid expenses');
console.log('PASS: partial shared-debt deletion keeps cash/payment totals aligned; salary cancellation is blocked when it would create a negative wallet; deleting a recurring commitment preserves historical payments.');
