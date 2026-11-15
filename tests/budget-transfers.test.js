const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const start=script.indexOf('function budgetTransferNet(');
const end=script.indexOf('\nfunction allocatedForGoal',start);
if(start<0||end<0)throw Error('Budget transfer functions not found');
const source=script.slice(script.indexOf('function incomeForMonth('),start)+script.slice(start,end)+'\nglobalThis.__test={budgetTransferNet,budgetCarryIn,budget,budgetRemaining,budgetTransferTotals};';
const ctx={
 CATS:[{id:'needs',pct:55},{id:'fun',pct:5},{id:'debt',pct:10},{id:'saving',pct:15},{id:'invest',pct:10},{id:'charity',pct:5}],
 state:{salary:20000,salaryPeriod:'monthly',dailyIncomes:{},dailyIncomeEntries:[],moneyMoves:[{type:'salary',date:'2026-11-01',amount:20000}],budgets:{needs:55,fun:5,debt:10,saving:15,invest:10,charity:5},budgetStartMonth:'2026-11',expenses:[],budgetTransfers:[]},
 validNum:(v,d=0)=>Number.isFinite(Number(v))?Number(v):d,
 monthKey:d=>String(d||'2026-11-16').slice(0,7),
 categorySpent:(id,m)=>ctx.state.expenses.filter(e=>e.cat===id&&String(e.date).slice(0,7)===m).reduce((n,e)=>n+Number(e.amount||0),0),
};
vm.createContext(ctx);vm.runInContext(source,ctx);
const {budget,budgetRemaining,budgetTransferTotals}=ctx.__test;
const eq=(a,b,label)=>{if(Math.abs(a-b)>.001)throw Error(`${label}: expected ${b}, got ${a}`)};
const cat=id=>ctx.CATS.find(c=>c.id===id);
eq(budget(cat('needs'),'2026-11'),11000,'initial needs budget');
eq(budget(cat('saving'),'2026-11'),3000,'initial saving budget');
// Move money in both directions and between non-saving categories.
ctx.state.budgetTransfers.push({id:'t1',from:'needs',to:'saving',amount:500,date:'2026-11-16'});
ctx.state.budgetTransfers.push({id:'t2',from:'fun',to:'invest',amount:200,date:'2026-11-16'});
ctx.state.budgetTransfers.push({id:'t3',from:'saving',to:'debt',amount:100,date:'2026-11-16'});
eq(budget(cat('needs'),'2026-11'),10500,'needs decreases after transfer');
eq(budget(cat('saving'),'2026-11'),3400,'saving receives and can transfer part onward');
eq(budget(cat('debt'),'2026-11'),2100,'debt receives transfer');
eq(budget(cat('fun'),'2026-11'),800,'fun decreases');
eq(budget(cat('invest'),'2026-11'),2200,'investment receives transfer');
eq(budgetRemaining(cat('needs'),'2026-11'),10500,'source available balance reflects transfer');
const totals=budgetTransferTotals('saving','2026-11');eq(totals.incoming,500,'saving incoming total');eq(totals.outgoing,100,'saving outgoing total');
// Transfers must be neutral across the total budget.
eq(ctx.CATS.reduce((sum,c)=>sum+budget(c,'2026-11'),0),20000,'all category allocations remain equal to total income');
// Transfer history carries forward into next month as part of each category's balance.
ctx.state.moneyMoves.push({type:'salary',date:'2026-12-01',amount:20000});
eq(budget(cat('saving'),'2026-12'),6400,'transferred saving balance carries forward');
const htmlHasClear=html.includes('onclick="confirmClearRecords()"')&&html.includes('data-page="historyPage"');
if(!htmlHasClear)throw Error('Clear records action must be reachable from history tab and page header');
if(!script.includes("to:String(to)")&&!script.includes('to:dest'))throw Error('Transfer destination is not stored');
console.log('PASS: two-way category transfers, incoming/outgoing totals, neutral total budget, carry-forward, and reachable clear-records action.');
