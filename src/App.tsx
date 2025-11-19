import './App.css'
import { StockPage } from './pages/StockPage';
import { Header } from './shared/Components/Header';

function App() {

    return (
        <div className="min-h-screen bg-background font-sans antialiased">
            <Header />
            <main className="container mx-auto p-4">
                <StockPage />
            </main>
        </div>
    );
}

export default App;
