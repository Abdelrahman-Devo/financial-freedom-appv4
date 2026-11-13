# Capacitor Android CI fix

The previous package.json had empty dependencies and devDependencies. Therefore `npx cap` had no local Capacitor CLI executable, producing `npm error could not determine executable to run`.

## GitHub Actions

The included `.github/workflows/android.yml` installs the local Capacitor packages before invoking the CLI, uses Node 22 and Java 21, adds Android, syncs the `www/` web assets, builds a debug APK, and uploads it as an artifact.

## Local commands

```bash
npm install
npx cap add android
npx cap sync android
cd android && ./gradlew assembleDebug
```

If `android/` already exists, do not run `npx cap add android` again; run `npx cap sync android` instead.

The app's web assets are in `www/`, matching `webDir` in `capacitor.config.json`.


## Financial engine v6 — unified cash-flow rules

- The monthly salary field is a planned/reference amount only. Monthly income and category budgets count salary only after a salary receipt is recorded.
- Salary receipts go to a dedicated income wallet for the selected method (cash, e-wallet, or bank). Repeated receipts of the same method reuse that wallet; different methods remain separate wallets.
- Budget categories are allocations, not physical wallets. Transfers between physical wallets do not create income or spending.
- Every new expense must identify its source wallet. Every expense type, including debt payments and savings contributions, reduces that wallet and the month's remaining income.
- Savings contributions move value out of the source wallet and into the selected goal balance. Net worth counts goal balances once, not both the original expense and the goal.
- Debt payments are linked to the selected debt record. The wallet decreases and the outstanding debt decreases by the same amount. Editing/deleting linked payments is routed through the debt screen to avoid breaking the relationship.
- Deleting an expense reverses its wallet and budget impact automatically. Linked debt-payment records are removed with their expense.
- Budget surpluses and deficits both carry forward; overspending is no longer silently reset to zero in the next month.
- The combined history avoids showing linked debt payments twice. Legacy expenses with no wallet source are preserved and flagged for reconciliation instead of assigning them to an arbitrary wallet.
- Gold scenarios remain illustrative assumptions, not guaranteed market predictions.

## Regression tests

Run the financial-engine checks with:

```bash
npm run test:finance
```

The checks cover received-vs-planned income, wallet outflows, savings/net-worth accounting, debt repayment, deficit carry-forward, deletion reversal, and transfer neutrality.

The root `index.html` and `www/index.html` are kept identical for Capacitor.
