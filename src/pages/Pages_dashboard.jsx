import React from 'react'
import Layout from '../Layout/Layout' 
import Dashboard from '../components/Dashboard'
import { Box } from '@mui/material'

const Pages_dashboard = () => {
  return (
    <Layout>
        <Box sx={{ overflow: 'hidden' }}>
            <Dashboard />
        </Box>
    </Layout>
  )
}

export default Pages_dashboard