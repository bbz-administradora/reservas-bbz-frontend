import { NextRequest, NextResponse } from 'next/server'

export type MiddlewareHandler = (
  request: NextRequest,
) => Promise<NextResponse | undefined>

export type ResponseModifier = (
  request: NextRequest,
  response?: NextResponse,
) => Promise<NextResponse | undefined>
