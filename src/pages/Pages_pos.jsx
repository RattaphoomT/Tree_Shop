import React from 'react'
import Layout from '../Layout/Layout'
import { Box } from '@mui/material'
import POS from '../components/POS'

const pos = () => {
return (
    <Layout>
        <Box sx={{ overflow: 'hidden' }}>
            <POS/>
        </Box>
    </Layout>
)
}

export default pos