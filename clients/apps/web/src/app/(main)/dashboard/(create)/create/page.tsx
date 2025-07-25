import revalidate from '@/app/actions'
import { getServerSideAPI } from '@/utils/client/serverside'
import { getAuthenticatedUser } from '@/utils/user'
import { schemas } from '@polar-sh/client'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import ClientPage from './ClientPage'

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Create Organization', // " | Polar is added by the template"
  }
}

export default async function Page({
  searchParams: { slug, auto, existing_org },
}: {
  searchParams: { slug?: string; auto?: string; existing_org?: boolean }
}) {
  let validationErrors: schemas['ValidationError'][] = []
  let error: string | undefined = undefined

  // Create the organization automatically if the slug is provided and auto is true
  if (auto === 'true' && slug) {
    const api = getServerSideAPI()
    const { data: organization, error } = await api.POST('/v1/organizations/', {
      body: {
        name: slug,
        slug,
      },
    })
    if (error && error.detail) {
      validationErrors = error.detail
    }
    if (organization) {
      await revalidate(`organizations:${organization.id}`)
      await revalidate(`organizations:${organization.slug}`)
      await revalidate(`storefront:${organization.slug}`)
      const currentUser = await getAuthenticatedUser()
      await revalidate(`users:${currentUser?.id}:organizations`)
      return redirect(`/dashboard/${organization.slug}/onboarding/product`)
    }
  }

  return (
    <ClientPage
      hasExistingOrg={!!existing_org}
      validationErrors={validationErrors}
      error={error}
    />
  )
}
