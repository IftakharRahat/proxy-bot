import { TransactionsPage } from './pages/TransactionsPage';
// ... imports

// ... inside Routes
            <Route path="purchases" element={<PurchaseHistory />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="settings" element={<SettingsPage />} />

export default App;
