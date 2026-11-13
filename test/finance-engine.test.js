const fs=require('fs'),vm=require('vm'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const start=script.indexOf('function incomeForMonth(');
const end=script.indexOf('function formatArabicDate',start);
const engineStart=script.indexOf('const FinanceEngine={',end);
const engineEnd=script.indexOf('function goldProjectionHtml',engineStart);
if(start<0||end<0||engineStart<0||engineEnd<0)throw Error('Engine sections not found');
const source=script.slice(start,end)+script.slice(engineStart,engineEnd)+'\nglobalThis.__test={FinanceEngine,goalSaved,debtRemaining,netWorth,budget,budgetCarryIn,incomeForMonth};';
const ctx={
 CATS:[{id:'needs',pct:55},{id:'fun',pct:5},{id:'debt',pct:10},{id:'saving',pct:15},{id:'invest',pct:10},{id:'charity',pct:5}],
 state:{salary:20000,salaryPeriod:'monthly',dailyIncomes:{},dailyIncomeEntries:[],moneyMoves:[{id:'salary',type:'salary',date:'2026-11-01',amount:20000,toWalletId:'cash'}],budgets:{needs:55,fun:5,debt:10,saving:15,invest:10,charity:5},budgetStartMonth:'2026-11',expenses:[],goals:[{id:'g1',target:5000,manualSaved:0}],debts:[{id:'d1',type:'owed',total:2000}],paymentGroups:[],wallets:[{id:'cash',name:'كاش',openingBalance:0}],assets:[]},
 validNum:(v,d=0)=>Number.isFinite(Number(v))?Number(v):d,
 monthKey:d=>String(d||'2026-11-13').slice(0,7),
 categorySpent:(id,m)=>ctx.state.expenses.filter(e=>e.cat===id&&String(e.date).slice(0,7)===m).reduce((n,e)=>n+Number(e.amount||0),0),
};
vm.createContext(ctx);vm.runInContext(source,ctx);
const assert=(v,m)=>{if(!v)throw Error(m)};
const eq=(a,b,m)=>assert(Math.abs(a-b)<.001,`${m}: expected ${b}, got ${a}`);
// 1) Salary only counts when actually received.
eq(ctx.__test.incomeForMonth('2026-11'),20000,'received salary');
ctx.state.moneyMoves=[];eq(ctx.__test.incomeForMonth('2026-11'),0,'unreceived salary must not count');
ctx.state.moneyMoves=[{id:'salary',type:'salary',date:'2026-11-01',amount:20000,toWalletId:'cash'}];
// 2) Spending of any category leaves the actual wallet.
ctx.state.expenses=[{id:'e1',date:'2026-11-02',month:'2026-11',cat:'fun',amount:500,walletId:'cash'}];
eq(ctx.__test.FinanceEngine.walletBalance(ctx.state.wallets[0]),19500,'ordinary expense wallet balance');
// 3) Saving leaves wallet and is counted once as a savings asset.
ctx.state.expenses.push({id:'e2',date:'2026-11-03',month:'2026-11',cat:'saving',amount:1000,walletId:'cash',allocations:[{goalId:'g1',amount:1000}]});
eq(ctx.__test.FinanceEngine.walletBalance(ctx.state.wallets[0]),18500,'saving wallet balance');
eq(ctx.__test.goalSaved(ctx.state.goals[0]),1000,'goal balance');
eq(ctx.__test.netWorth(),17500,'net worth after savings must not double count');
// 4) Debt payment lowers wallet and liability by the same amount.
ctx.state.expenses.push({id:'e3',date:'2026-11-04',month:'2026-11',cat:'debt',amount:500,walletId:'cash',debtId:'d1',debtPaymentId:'p1'});
ctx.state.paymentGroups=[{id:'p1',type:'owed',allocations:[{debtId:'d1',amount:500}]}];
eq(ctx.__test.FinanceEngine.walletBalance(ctx.state.wallets[0]),18000,'debt payment wallet balance');
eq(ctx.__test.debtRemaining(ctx.state.debts[0]),1500,'remaining debt');
eq(ctx.__test.netWorth(),17500,'debt payment must not change net worth');
// 5) Deficit carries into next month.
ctx.state.expenses.push({id:'e4',date:'2026-11-05',month:'2026-11',cat:'needs',amount:12000,walletId:'cash'});
eq(ctx.__test.budgetCarryIn({id:'needs',pct:55},'2026-12'),-1000,'negative budget carry');
ctx.state.moneyMoves.push({id:'salary2',type:'salary',date:'2026-12-01',amount:20000,toWalletId:'future'});
eq(ctx.__test.budget({id:'needs',pct:55},'2026-12'),10000,'next month budget after deficit');
// 6) Removing a savings transaction restores cash and removes the goal asset.
ctx.state.expenses=ctx.state.expenses.filter(e=>e.id!=='e2');
eq(ctx.__test.FinanceEngine.walletBalance(ctx.state.wallets[0]),7000,'deleting saving restores wallet');
eq(ctx.__test.goalSaved(ctx.state.goals[0]),0,'deleting saving restores goal balance');
eq(ctx.__test.netWorth(),5500,'deleting saving preserves net worth');
// 7) Transfers change individual wallets but not combined cash.
ctx.state.wallets.push({id:'bank',name:'بنك',openingBalance:0});
ctx.state.moneyMoves.push({id:'tr',type:'transfer',date:'2026-11-06',amount:1000,fromWalletId:'cash',toWalletId:'bank'});
eq(ctx.__test.FinanceEngine.walletBalance(ctx.state.wallets[0]),6000,'transfer source');
eq(ctx.__test.FinanceEngine.walletBalance(ctx.state.wallets[1]),1000,'transfer destination');
eq(ctx.__test.FinanceEngine.walletBalance(ctx.state.wallets[0])+ctx.__test.FinanceEngine.walletBalance(ctx.state.wallets[1]),7000,'transfer total unchanged');
console.log('PASS: received income, wallet outflows, savings asset, debt payment, net worth, negative carry, deletion reversal, transfer neutrality.');
