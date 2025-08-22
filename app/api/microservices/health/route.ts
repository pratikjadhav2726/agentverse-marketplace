import { NextRequest, NextResponse } from 'next/server'
import { checkMicroservicesHealth } from '@/lib/microservices'

export async function GET(request: NextRequest) {
  try {
    const healthResults = await checkMicroservicesHealth()
    
    const allHealthy = Object.values(healthResults).every(
      result => result.status === 'healthy'
    )
    
    return NextResponse.json({
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: healthResults,
    }, {
      status: allHealthy ? 200 : 503
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, {
      status: 500
    })
  }
}