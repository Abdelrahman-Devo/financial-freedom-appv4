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


## Financial engine v5 — real wallets and budget allocations

- Salary receipt is recorded in a dedicated **Income / Salary Wallet**. The user selects cash, e-wallet, or bank; the salary increases the monthly income and the selected wallet balance once.
- Transfers from the income wallet to other real wallets move balances without creating income or expenses.
- Monthly budget categories remain allocations, not bank accounts. Previous unused category allocations roll forward into later months.
- Normal expenses reduce the month's remaining income and the selected real wallet balance. Deleting an expense reverses both automatically.
- Savings allocations are tracked against a selected goal and a holding wallet. Savings remain part of owned wallet balances (they are earmarked, not consumed).
- Debt-category expenses require a selected debt and a payment wallet. They create/update a linked debt-payment record; deleting or editing the expense updates the debt balance and wallet balance together.
- Savings goals accept an expected monthly contribution and show an estimated completion date. If no monthly contribution is entered, the app estimates from the last three months of contributions.
- Gold assets show illustrative 30/90/180/365-day scenarios based on -10%, 0%, and +10% annual assumptions. These are scenarios, not market-price forecasts or guarantees.

The root `index.html` and `www/index.html` are kept identical for Capacitor.
