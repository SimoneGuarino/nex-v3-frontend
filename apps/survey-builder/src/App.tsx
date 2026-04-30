import { useEffect, useMemo, useState } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { notifyShellLoadingReady, readToken, toggleGlobalPanel } from '@nex/shared-platform';

function SurveyList() {
    const items = [
        { id: 'customer-sat', name: 'Customer Satisfaction B2B' },
        { id: 'sales-followup', name: 'Follow-up Commerciale' },
    ];

    return (
        <section>
            <h1>Survey Builder</h1>
            <p>POC della nuova web-app separata, agganciata al dominio Marketing.</p>
            <div className="grid">
                {items.map((item) => (
                    <Link key={item.id} className="card" to={`/builder/${item.id}`}>
                        <strong>{item.name}</strong>
                        <span>Apri builder</span>
                    </Link>
                ))}
            </div>
        </section>
    );
};

function BuilderPage() {
    const [title, setTitle] = useState('Survey demo V3');
    const [questions, setQuestions] = useState([
        { id: 1, type: 'rating', label: 'Valuta il servizio ricevuto' },
        { id: 2, type: 'text', label: 'Commenti aggiuntivi' },
    ]);

    const schema = useMemo(
        () => ({
            title,
            questions,
            status: 'draft',
            target: { type: 'group', value: 'Clienti attivi' },
        }),
        [title, questions]
    );

    return (
        <section>
            <div className="topbar">
                <Link to="/">← Torna elenco</Link>
                <a href="/legacy/marketing/survey_builder">Apri dal legacy</a>
                <button type="button" onClick={() => toggleGlobalPanel('notifications', { source: 'survey-builder' })}>Notifiche</button>
                <button type="button" onClick={() => toggleGlobalPanel('chat', { source: 'survey-builder' })}>Chat</button>
                <button type="button" onClick={() => toggleGlobalPanel('profile', { source: 'survey-builder' })}>Profilo</button>
            </div>
            <h1>Builder survey</h1>
            <div className="builder-layout">
                <div className="panel">
                    <label>Titolo survey</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} />
                    <button
                        onClick={() =>
                            setQuestions((prev) => [
                                ...prev,
                                { id: Date.now(), type: 'single-choice', label: 'Nuova domanda' },
                            ])
                        }
                    >
                        Aggiungi domanda
                    </button>
                    <div className="questions">
                        {questions.map((q) => (
                            <div key={q.id} className="question-row">
                                <strong>{q.type}</strong>
                                <input
                                    value={q.label}
                                    onChange={(e) =>
                                        setQuestions((prev) =>
                                            prev.map((x) => (x.id === q.id ? { ...x, label: e.target.value } : x))
                                        )
                                    }
                                />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="panel">
                    <h3>Schema JSON</h3>
                    <pre>{JSON.stringify(schema, null, 2)}</pre>
                    <div className="session">token presente: {readToken() ? 'sì' : 'no'}</div>
                </div>
            </div>
        </section>
    );
};

function App() {
    useEffect(() => {
        window.dispatchEvent(
            new CustomEvent("nex:mfe-ready", {
                detail: { app: "survey" },
            })
        );

        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: "nex:mfe-ready", app: "survey" }, "*");
        }

        notifyShellLoadingReady({ app: "survey", source: "survey-root-mounted" });
        if (typeof window !== "undefined" && window.parent) {
            window.parent.postMessage({ type: "nex:mfe-ready", app: "survey" }, window.location.origin);
        }
    }, []);


    return (
        <div className="app">
            <Routes>
                <Route path="/" element={<SurveyList />} />
                <Route path="/builder/:id" element={<BuilderPage />} />
            </Routes>
        </div>
    );
};

export default App;
