import { notFound } from 'next/navigation'
import { listCategories, listLocations, listLanguages } from '@/app/actions/ref-data'
import { getContent } from '@/app/actions/content'
import { AddContentForm } from '../../_components/add-content-form'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditContentPage({ params }: Props) {
  const { id } = await params

  const [contentResult, categoriesResult, locationsResult, languagesResult] = await Promise.all([
    getContent(id),
    listCategories(),
    listLocations(),
    listLanguages(),
  ])

  if (!contentResult.ok) notFound()

  const categories = categoriesResult.ok ? categoriesResult.data : []
  const locations  = locationsResult.ok  ? locationsResult.data  : []
  const languages  = languagesResult.ok  ? languagesResult.data  : []

  return (
    <AddContentForm
      categories={categories}
      locations={locations}
      languages={languages}
      editContent={contentResult.data}
    />
  )
}
