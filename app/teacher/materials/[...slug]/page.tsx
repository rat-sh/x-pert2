import { redirect } from 'next/navigation';

// Redirect dynamic slug to root — folders are handled client-side in MaterialsManagerPage
export default function TeacherMaterialsSlug() {
  redirect('/teacher/materials');
}
