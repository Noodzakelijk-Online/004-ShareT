
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "How secure are the shared links?",
      answer: "ShareT prioritizes security. All shared links can be password-protected, set with expiration dates, and are generated with unique tokens. We use industry-standard encryption to ensure your Trello data remains secure."
    },
    {
      question: "Do external collaborators need a Trello account?",
      answer: "No, external collaborators do not need a Trello account to view the shared cards or lists. They simply need the secure link (and password if you've set one)."
    },
    {
      question: "Can I revoke access to a shared link?",
      answer: "Yes, you can revoke access to any shared link at any time from your ShareT dashboard. Once revoked, the link will no longer work, even if it hasn't reached its expiration date."
    },
    {
      question: "How many free shares do I get?",
      answer: "New users receive 3 free shares to try out the service. After that, you'll need to subscribe to one of our plans based on your usage needs."
    },
    {
      question: "Can I customize what information is visible on shared cards?",
      answer: "Yes, before generating a share link, you can choose which elements of the card are visible (comments, attachments, checklists, etc.) to provide exactly the information your external collaborators need."
    },
    {
      question: "Does ShareT support all Trello features?",
      answer: "ShareT supports most core Trello features including cards, lists, comments, attachments, and checklists. We're continuously adding support for more features based on user feedback."
    }
  ];

  return (
    <section id="faq" className="py-16 bg-[#0d1117]">
      <div className="max-w-4xl mx-auto px-6 md:px-10">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="bg-[#161b22] rounded-lg border border-gray-800">
              <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-[#1c2333] rounded-t-lg transition-colors">
                <span className="font-medium text-lg">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="px-6 py-4 text-gray-300">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default FAQ;
