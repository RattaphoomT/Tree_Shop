import React from 'react'
import Layout from '../Layout/Layout' // ตรวจสอบ Path ให้ถูกต้องตามโครงสร้างไฟล์ของคุณ
import Dashboard from '../components/Dashboard' // ตรวจสอบ Path ให้ถูกต้อง
import { Box } from '@mui/material'

const Pages_dasborad = () => {
  return (
    <Layout>
        <Box sx={{ overflow: 'hidden' }}>
            <Dashboard />
        </Box>
    </Layout>
  )
}

export default Pages_dasborad