import Head from 'next/head';
import Link from 'next/link';
import VetFileApp from '../components/VetFileApp';

export default function AppPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Head>
        <title>VetFile.ai - VA Claims Assistant</title>
        <meta name="description" content="AI-powered tool to analyze military records and identify potential VA disability claims" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="border-b bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-blue-800">VetFile.ai</Link>
          <nav>
            <ul className="flex space-x-6">
              <li><Link href="/" className="text-gray-600 hover:text-blue-800">Home</Link></li>
              <li><Link href="/#how-it-works" className="text-gray-600 hover:text-blue-800">How It Works</Link></li>
              <li><Link href="/#about" className="text-gray-600 hover:text-blue-800">About</Link></li>
            </ul>
          </nav>
        </div>
      </header>

      <main>
        <VetFileApp />
      </main>

      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-400">
            &copy; {new Date().getFullYear()} VetFile.ai. All rights reserved. Not affiliated with the Department of Veterans Affairs.
          </p>
        </div>
      </footer>
    </div>
  );
}
