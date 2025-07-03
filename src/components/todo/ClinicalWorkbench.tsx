import React from 'react';
import useCollection from '../../hooks/useFirestore';
import { ToDo } from '../../types';
import { useAuth } from '../../context/AuthContext';

const ClinicalWorkbench: React.FC = () => {
    const { user } = useAuth();
    const { data: todos, loading } = useCollection<ToDo>('todos', [
        ['assigneeId', '==', user?.uid]
    ]);

    if (loading) return <div>Loading Clinical Tasks...</div>;

    const reports = todos.filter(t => t.category === 'consult_report' && t.status !== 'completed');
    const carePlans = todos.filter(t => t.category === 'care_plan_initial' && t.status !== 'completed');
    const chartsToSign = todos.filter(t => t.category === 'chart_review' && t.status !== 'completed');

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Clinical Workbench</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Column for Consult Reports */}
                <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Consult Reports Due</h3>
                    <div className="space-y-2">
                        {reports.length > 0 ? reports.map(todo => (
                            <div key={todo.id} className="bg-gray-100 p-2 rounded">{todo.title}</div>
                        )) : <p className="text-sm text-gray-400 italic">None</p>}
                    </div>
                </div>
                 {/* Column for Care Plans */}
                <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Care Plans to Complete</h3>
                     <div className="space-y-2">
                        {carePlans.length > 0 ? carePlans.map(todo => (
                            <div key={todo.id} className="bg-gray-100 p-2 rounded">{todo.title}</div>
                        )) : <p className="text-sm text-gray-400 italic">None</p>}
                    </div>
                </div>
                 {/* Column for Charts to Sign */}
                <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Charts To Sign</h3>
                     <div className="space-y-2">
                        {chartsToSign.length > 0 ? chartsToSign.map(todo => (
                            <div key={todo.id} className="bg-gray-100 p-2 rounded">{todo.title}</div>
                        )) : <p className="text-sm text-gray-400 italic">None</p>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ClinicalWorkbench;