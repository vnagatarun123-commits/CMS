import { ContributorDetailClient } from './_components/contributor-detail-client'

export default async function ContributorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ContributorDetailClient id={id} />
}
