import { listCategories, listLocations, listLanguages } from '@/app/actions/ref-data'
import { RefDataClient } from './_components/ref-data-client'

export default async function RefDataPage() {
  const [categoriesResult, locationsResult, languagesResult] = await Promise.all([
    listCategories(),
    listLocations(),
    listLanguages(),
  ])

  const categories = categoriesResult.ok ? categoriesResult.data : []
  const locations = locationsResult.ok ? locationsResult.data : []
  const languages = languagesResult.ok ? languagesResult.data : []

  return (
    <RefDataClient
      initialCategories={categories}
      initialLocations={locations}
      initialLanguages={languages}
    />
  )
}
