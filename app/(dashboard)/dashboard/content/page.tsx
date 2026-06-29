import { listContent } from '@/app/actions/content'
import { listCategories, listLocations, listLanguages } from '@/app/actions/ref-data'
import { ContentListClient } from './_components/content-list-client'

export default async function ContentPage() {
  const [contentResult, categoriesResult, locationsResult, languagesResult] = await Promise.all([
    listContent(),
    listCategories(),
    listLocations(),
    listLanguages(),
  ])

  const content = contentResult.ok ? contentResult.data : []
  const categories = categoriesResult.ok ? categoriesResult.data : []
  const locations = locationsResult.ok ? locationsResult.data : []
  const languages = languagesResult.ok ? languagesResult.data : []

  return (
    <ContentListClient
      initialContent={content}
      categories={categories}
      locations={locations}
      languages={languages}
    />
  )
}
