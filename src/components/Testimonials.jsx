
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Project Manager",
    company: "TechCorp",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80",
    quote: "ShareT has completely transformed how we collaborate with our clients. No more worrying about giving too much access to our Trello boards!"
  },
  {
    name: "Michael Chen",
    role: "Product Lead",
    company: "Innovate Inc",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80",
    quote: "The ability to share specific cards with contractors while keeping the rest of our project private has saved us countless headaches. Highly recommend!"
  },
  {
    name: "Jessica Rivera",
    role: "Marketing Director",
    company: "BrandWave",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80",
    quote: "We've been using ShareT for 6 months and it's become an essential part of our client onboarding process. The QR code feature is especially useful for our in-person meetings."
  },
  {
    name: "David Williams",
    role: "CTO",
    company: "DataFlow",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80",
    quote: "ShareT strikes the perfect balance between security and usability. Our external partners love how easy it is to access just what they need."
  }
];

const Testimonials = () => {
  return (
    <section className="py-16 bg-[#0d1117]">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">What Our Users Say</h2>
        
        <Carousel
          opts={{ loop: true }}
          className="w-full max-w-4xl mx-auto"
        >
          <CarouselContent>
            {testimonials.map((testimonial, index) => (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/2">
                <div className="bg-[#161b22] rounded-lg p-6 h-full border border-gray-800 hover:border-blue-500/50 transition-colors duration-300">
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-gray-400">{testimonial.role}, {testimonial.company}</p>
                    </div>
                  </div>
                  <p className="text-gray-300 italic">&quot;{testimonial.quote}&quot;</p>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="left-0 bg-blue-500 hover:bg-blue-600 border-none" />
          <CarouselNext className="right-0 bg-blue-500 hover:bg-blue-600 border-none" />
        </Carousel>
      </div>
    </section>
  );
};

export default Testimonials;
