import React from 'react';
import { useUserContext } from 'context/UserContext';

// Componenets
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import TesisForm from './components/Form';
import FDBox from 'components/UI/box/FDBox';
import InfoPanel from './components/InfoPanel';

export function InserimentoFBOF() {
    const [userContext] = useUserContext();
    return (
        <DashboardLayout>
            <div className='w-full h-full flex flex-col gap-2'>
                <FDBox
                    fullWidth
                    radius='lg'
                    pad='sm'
                >
                    <h1>Inserimento ordini FB | OF</h1>
                </FDBox>
                <TesisForm />
                <InfoPanel />
            </div>
        </DashboardLayout>
    );
}

export default InserimentoFBOF;
