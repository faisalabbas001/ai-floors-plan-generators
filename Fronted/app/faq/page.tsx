import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/sections/footer'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export default function FAQPage() {
  const faqs = [
    {
      question: 'What is this AI floor plan generator?',
      answer:
        'Floor Plan AI is an advanced artificial intelligence-powered tool that helps you create professional 2D and 3D architectural floor plans in minutes. Simply describe your requirements, and our AI generates detailed, accurate floor plans based on architectural best practices and your specifications.',
    },
    {
      question: 'Can I create both 2D and 3D floor plans?',
      answer:
        'Yes! Our platform supports multiple output styles including Technical (2D blueprint style), 2.5D (isometric view with depth), and full 3D visualization. You can choose your preferred style during generation or switch between them after creation.',
    },
    {
      question: 'Are Pakistani city bylaws supported?',
      answer:
        'While our AI is trained on international architectural standards, you can specify local building codes and requirements in your prompt. For Pakistani city bylaws, simply mention the specific regulations you need to follow (like Lahore, Karachi, or Islamabad building codes), and the AI will incorporate those constraints into the design.',
    },
    {
      question: 'Can I edit the generated plan manually?',
      answer:
        'Absolutely! Our interactive editor allows you to fully customize any AI-generated floor plan. You can drag and drop furniture, add or remove walls, adjust room dimensions, place doors and windows, and fine-tune every aspect of your design with an intuitive visual interface.',
    },
    {
      question: 'Is this tool suitable for banks and commercial buildings?',
      answer:
        'Yes, Floor Plan AI is designed for both residential and commercial projects. Whether you need layouts for banks, offices, retail spaces, restaurants, or commercial complexes, our AI can generate professional plans that meet commercial building standards and accessibility requirements.',
    },
    {
      question: 'Can I download or export the plans?',
      answer:
        'Yes, you can export your floor plans in multiple formats including PDF (for printing), PNG/JPG (for presentations), and SVG (for further editing in design software). High-resolution exports are available for professional documentation and construction purposes.',
    },
    {
      question: 'Does the editor work on mobile devices?',
      answer:
        'Yes! Our editor is fully responsive and optimized for tablets and mobile devices. While complex editing is easier on larger screens, you can view, make adjustments, and even create simple floor plans on your smartphone or tablet.',
    },
    {
      question: 'How accurate are the AI-generated floor plans?',
      answer:
        'Our AI is trained on thousands of professional architectural layouts and follows industry-standard proportions and spatial requirements. The generated plans include accurate dimensions, proper room ratios, and realistic furniture placement. However, we always recommend having final plans reviewed by a licensed architect for construction projects.',
    },
    {
      question: 'Do I need to sign up to use the tool?',
      answer:
        'You can try our floor plan generator with limited features without signing up. However, creating an account gives you access to unlimited generations, the full editor suite, project saving, collaboration features, and high-resolution exports.',
    },
    {
      question: 'What are the system requirements?',
      answer:
        'Floor Plan AI is a web-based application that works in any modern browser (Chrome, Firefox, Safari, Edge). No installation is required. For the best experience, we recommend a stable internet connection and a device with at least 4GB RAM.',
    },
    {
      question: 'Can I collaborate with others on a floor plan?',
      answer:
        'Yes, our Pro plan includes collaboration features that allow multiple team members to view and edit floor plans simultaneously. You can share project links, leave comments, and track revision history.',
    },
    {
      question: 'How long does it take to generate a floor plan?',
      answer:
        'AI generation typically takes 30-60 seconds depending on the complexity of your requirements. Simple residential layouts generate faster, while complex commercial buildings with detailed specifications may take up to 2 minutes.',
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about Floor Plan AI
          </p>
        </div>

        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-border rounded-lg px-6 bg-card"
            >
              <AccordionTrigger className="text-left hover:no-underline py-5">
                <span className="font-semibold text-base">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-16 text-center bg-muted rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-3">Still have questions?</h2>
          <p className="text-muted-foreground mb-6">
            {"Can't find the answer you're looking for? Our support team is here to help."}
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="mailto:support@floorplan.ai"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Contact Support
            </a>
            <a
              href="/generator"
              className="inline-flex items-center justify-center rounded-md border border-border bg-background px-6 py-3 text-sm font-medium hover:bg-accent transition-colors"
            >
              Try Floor Plan AI
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
