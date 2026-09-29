import { updateTitle } from '../actions/updateTitle';

export default async function ServerActionsPage() {
  console.log('Rendering ServerActionsPage on the server');

  const randomNumber = Math.floor(Math.random() * 100);
  const nowDate = new Date().toISOString();
  const posts = await fetch('https://jsonplaceholder.typicode.com/posts').then(
    (res) => res.json(),
  );

  return (
    <div>
      <h1 className="text-3xl mb-3">Server Actions</h1>
      <p className="text-gray-600 mb-4">
        This is a simple example of server component calling exteranal server
        action in Next.js.
      </p>
      <p className="text-lg font-bold mb-10">Random Number: {randomNumber}</p>
      <p className="text-md text-gray-500 mb-10">Current Date: {nowDate}</p>
      <ul>
        {posts.map((post: { title: string; id: string }) => (
          <li key={post.id} className="w-1/4 flex space-between mb-2">
            <span>{post.title}</span>
            <span className="w-20 ml-auto">
              <form action={updateTitle} className="w-20 flex gap-2">
                <input
                  type="text"
                  name="title"
                  placeholder="New title"
                  className="border border-gray-300"
                />
                <button type="submit" className="border border-gray-300">
                  Update
                </button>
              </form>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
