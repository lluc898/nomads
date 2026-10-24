import { featuredTrips } from "@viajeroshub/shared";

export async function GET() {
  return Response.json(featuredTrips);
}
