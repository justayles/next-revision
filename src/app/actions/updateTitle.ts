  'use server';
  
  export async function updateTitle(formData: FormData) {
  const title = formData.get('title') as string;
  console.log('Updating title to:', title);
  // Here you would typically send the updated title to your server or API
}
