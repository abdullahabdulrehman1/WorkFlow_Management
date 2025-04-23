import React from 'react'
import Workflows from '../pages/Workflows'
import { DropdownProvider } from '../components/context/DropdownContext'

const App = () => {
    return (
        <DropdownProvider>
            <Workflows />
        </DropdownProvider>
    )
}

export default App
