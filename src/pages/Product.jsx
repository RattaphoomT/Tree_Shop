import React from 'react'
import Layout from '../Layout/Layout'
import { Box } from '@mui/material'
import POS from '../components/POS'

const Product = () => {
  return (
    <Layout>
      <Box>
        <Box sx={{ mb: 3 }}>
          {/* contain */}
          {/* <h1>Content - รักนะทับทิม</h1>    */}
          <POS/>
        </Box>
      </Box>
    </Layout>
  )
}

export default Product