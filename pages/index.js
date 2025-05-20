import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Head>
        <title>VetFile.ai - VA Disability Claims Assistant</title>
        <meta name="description" content="AI-powered tool to analyze military records and identify potential VA disability claims" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className="border-b bg-white shadow-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-800">VetFile.ai</h1>
          <nav>
            <ul className="flex space-x-6">
              <li><a href="#" className="text-gray-600 hover:text-blue-800">Home</a></li>
              <li><a href="#how-it-works" className="text-gray-600 hover:text-blue-800">How It Works</a></li>
              <li><a href="#about" className="text-gray-600 hover:text-blue-800">About</a></li>
            </ul>
          </nav>
        </div>
      </header>

      <main>
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Welcome to VetFile.ai</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
              The AI-powered assistant that helps veterans identify potential VA disability claims from their service records.
            </p>
            <Link href="/app" className="px-8 py-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors text-lg">
              Try VetFile.ai Now
            </Link>
          </div>
        </section>
        
        <section id="how-it-works" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
                <h3 className="text-xl font-semibold mb-3">Upload Documents</h3>
                <p className="text-gray-600">Upload your DD214, medical records, and other service documents.</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
                <h3 className="text-xl font-semibold mb-3">AI Analysis</h3>
                <p className="text-gray-600">Our AI analyzes your documents to identify potential VA disability claims.</p>
              </div>
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
                <h3 className="text-xl font-semibold mb-3">Generate Forms</h3>
                <p className="text-gray-600">Select claims and generate pre-filled VA disability forms.</p>
              </div>
            </div>
          </div>
        </section>
        
        <section id="about" className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">About VetFile.ai</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              VetFile.ai was created to help veterans navigate the complex VA disability claims process. 
              Our mission is to ensure veterans receive all the benefits they've earned through their service.
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-gray-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-6 md:mb-0">
              <h2 className="text-xl font-bold mb-4">VetFile.ai</h2>
              <p className="text-gray-400 max-w-md">
                Helping veterans maximize their VA disability benefits by identifying potential claims from their service records.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Contact Us</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-6">
            <p className="text-center text-gray-400">
              &copy; {new Date().getFullYear()} VetFile.ai. All rights reserved. Not affiliated with the Department of Veterans Affairs.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
