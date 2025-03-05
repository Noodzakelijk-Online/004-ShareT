
import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Connect Your Trello Account",
    description: "Securely connect your Trello account to ShareT with just a few clicks. We only request read access to your boards.",
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=600&h=400&q=80"
  },
  {
    number: "02",
    title: "Select What to Share",
    description: "Choose specific cards or entire lists that you want to share with external collaborators.",
    image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&h=400&q=80"
  },
  {
    number: "03",
    title: "Configure Security Options",
    description: "Set expiration dates, add password protection, and choose which card elements to include.",
    image: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=600&h=400&q=80"
  },
  {
    number: "04",
    title: "Share and Track",
    description: "Generate secure links or QR codes, then track usage and manage all your shared items from your dashboard.",
    image: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&h=400&q=80"
  }
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-[#0a0d14]">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">How ShareT Works</h2>
        <p className="text-xl text-gray-400 text-center max-w-3xl mx-auto mb-16">
          Share your Trello content securely in just a few simple steps
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
          {steps.map((step, index) => (
            <div key={index} className="group">
              <div className="relative rounded-lg overflow-hidden mb-6 transform transition-transform group-hover:scale-[1.03] duration-300 shadow-xl">
                <div className="absolute inset-0 bg-blue-500/20 z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <img 
                  src={step.image} 
                  alt={step.title} 
                  className="w-full h-64 object-cover" 
                />
                <div className="absolute top-4 left-4 bg-blue-500 text-white text-xl font-bold w-12 h-12 rounded-full flex items-center justify-center z-20">
                  {step.number}
                </div>
              </div>
              
              <h3 className="text-2xl font-semibold mb-3 group-hover:text-blue-400 transition-colors">{step.title}</h3>
              <p className="text-gray-400">{step.description}</p>
              
              {index < steps.length - 1 && (
                <div className="hidden md:block mt-8 text-blue-500">
                  <ArrowRight className="w-6 h-6 mx-auto" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
