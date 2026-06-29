import { listCategories, listLocations, listLanguages } from '@/app/actions/ref-data'
import { AddContentForm } from '../_components/add-content-form'

export default async function NewContentPage() {
  const [categoriesResult, locationsResult, languagesResult] = await Promise.all([
    listCategories(),
    listLocations(),
    listLanguages(),
  ])

  const categories = categoriesResult.ok ? categoriesResult.data : []
  const locations  = locationsResult.ok  ? locationsResult.data  : []
  const languages  = languagesResult.ok  ? languagesResult.data  : []

  return (
    <AddContentForm
      categories={categories}
      locations={locations}
      languages={languages}
    />
  )
}
