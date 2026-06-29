import { listCategories, listLocations, listLanguages } from '@/app/actions/ref-data'
import { MasterDataClient } from './_components/master-data-client'

export default async function MasterDataPage() {
  const [catResult, locResult, langResult] = await Promise.all([
    listCategories(),
    listLocations(),
    listLanguages(),
  ])

  const categories = catResult.ok  ? catResult.data  : []
  const locations  = locResult.ok  ? locResult.data  : []
  const languages  = langResult.ok ? langResult.data : []

  return (
    <MasterDataClient
      categories={categories}
      locations={locations}
      languages={languages}
    />
  )
}
