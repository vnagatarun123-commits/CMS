import { listCategories, listLocations, listLanguages, listTags } from '@/app/actions/ref-data'
import { MasterDataClient } from './_components/master-data-client'

export default async function MasterDataPage() {
  const [catResult, locResult, langResult, tagResult] = await Promise.all([
    listCategories(),
    listLocations(),
    listLanguages(),
    listTags(),
  ])

  const categories = catResult.ok  ? catResult.data  : []
  const locations  = locResult.ok  ? locResult.data  : []
  const languages  = langResult.ok ? langResult.data : []
  const tags       = tagResult.ok  ? tagResult.data  : []

  return (
    <MasterDataClient
      categories={categories}
      locations={locations}
      languages={languages}
      tags={tags}
    />
  )
}
