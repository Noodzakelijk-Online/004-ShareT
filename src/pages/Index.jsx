
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import Testimonials from "@/components/Testimonials";
import FAQ from "@/components/FAQ";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import { ArrowRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  // Add smooth scrolling effect for anchor links
  useEffect(() => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href').slice(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth'
          });
        }
      });
    });
    
    // Animation on scroll
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
    
    document.querySelectorAll('section > div').forEach(section => {
      section.classList.add('opacity-0');
      observer.observe(section);
    });
    
    return () => {
      document.querySelectorAll('section > div').forEach(section => {
        observer.unobserve(section);
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      <Navigation />
      
      {/* Hero Section */}
      <section className="min-h-[90vh] flex items-center relative pt-20 pb-16 px-6 md:px-10 lg:px-20">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Securely share your <span className="text-blue-400">Trello cards</span> with anyone
            </h1>
            <p className="text-xl text-gray-300">
              Share specific cards or lists without exposing your entire Trello board. 
              Perfect for client collaboration and external team members.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                onClick={() => navigate("/app")} 
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-md text-lg"
                size="lg"
              >
                Start Sharing Now
              </Button>
              <Button 
                variant="outline" 
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
                size="lg"
                onClick={() => document.getElementById("how-it-works").scrollIntoView({ behavior: 'smooth' })}
              >
                See How It Works
              </Button>
            </div>
            <p className="text-gray-400 text-sm">
              No credit card required • Start with 3 free shares
            </p>
          </div>
          
          <div className="rounded-xl overflow-hidden shadow-2xl shadow-blue-500/10 border border-gray-800 hover-scale">
            <img 
              src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&h=500&q=80" 
              alt="ShareT dashboard preview" 
              className="w-full h-auto"
            />
          </div>
        </div>
        
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden">
          <svg className="w-full h-auto" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path 
              d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" 
              className="fill-[#0a0d14]"
            ></path>
          </svg>
        </div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-20 bg-[#0a0d14]">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Key Benefits</h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              ShareT provides everything you need to collaborate securely with external partners
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Selective Sharing",
                description: "Share only what's needed, keep the rest private. Maintain control over your Trello board.",
                icon: "🔒"
              },
              {
                title: "Expiration Control",
                description: "Set automatic expiration dates for shared links to ensure temporary access remains temporary.",
                icon: "⏱️"
              },
              {
                title: "Password Protection",
                description: "Add an extra layer of security with custom passwords for your shared Trello content.",
                icon: "🔑"
              },
              {
                title: "QR Code Generation",
                description: "Create QR codes for easy sharing in physical documents, presentations, or meetings.",
                icon: "📱"
              },
              {
                title: "Link Management",
                description: "Track and manage all your shared links from a central dashboard with usage analytics.",
                icon: "📊"
              },
              {
                title: "Instant Revocation",
                description: "Immediately revoke access to any shared link if your collaboration needs change.",
                icon: "❌"
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className="bg-[#161b22] rounded-xl p-6 border border-gray-800 hover:border-blue-500/50 transition-all duration-300 hover:translate-y-[-5px] hover:shadow-lg hover:shadow-blue-500/5"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* How It Works Section */}
      <HowItWorks />
      
      {/* Testimonials Section */}
      <Testimonials />
      
      {/* Pricing Section */}
      <Pricing />
      
      {/* FAQ Section */}
      <FAQ />
      
      {/* CTA Section */}
      <section className="py-20 bg-[#161b22]">
        <div className="max-w-4xl mx-auto text-center px-6 md:px-10">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to start sharing securely?</h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who trust ShareT for secure external collaboration
          </p>
          <Button 
            onClick={() => navigate("/app")} 
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-md text-lg group"
            size="lg"
          >
            <span>Get Started For Free</span>
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
          <p className="mt-4 text-gray-400">
            No credit card required • Start with 3 free shares
          </p>
        </div>
      </section>
      
      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
