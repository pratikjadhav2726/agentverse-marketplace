import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { SignJWT, jwtVerify } from "jose"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const JWT_SECRET = (process.env.JWT_SECRET || "dev-secret-key-change-me").padEnd(32, "!").slice(0, 32)
const JWT_EXPIRY = 60 * 30 // 30 minutes in seconds

function getSecretKey() {
  return new TextEncoder().encode(JWT_SECRET)
}

export async function signJwt(payload: object): Promise<string> {
  return await new SignJWT(payload as any)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${JWT_EXPIRY}s`)
    .sign(getSecretKey())
}

export async function verifyJwt(token: string): Promise<any | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey())
    return payload
  } catch (err) {
    return null
  }
}
