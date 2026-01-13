import React from 'react'
import Layout from '../Layout/Layout'
import { Box } from '@mui/material'
import History from '../components/History'

const Pages_history = () => {
  return (
    <Layout>
        <Box sx={{ overflow: 'hidden' }}>
            <History />
        </Box>
    </Layout>
  )
}

export default Pages_history