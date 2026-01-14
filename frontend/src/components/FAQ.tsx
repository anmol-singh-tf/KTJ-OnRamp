import React from 'react';
import { motion } from 'framer-motion';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'What is NexPay?',
    answer: 'NexPay is a next-generation crypto payment app that replaces traditional payment systems like UPI. It allows you to send money globally with zero transaction taxes using just your fingerprint.',
  },
  {
    question: 'How does biometric authentication work?',
    answer: 'Your fingerprint acts as your private key. Using WebAuthn technology, we generate a unique cryptographic key from your biometric data that secures your wallet. Your fingerprint never leaves your device.',
  },
  {
    question: 'Are there any fees?',
    answer: 'NexPay charges 0% transaction tax for international transfers. You only pay minimal network fees (gas) to process transactions on the blockchain, typically less than $0.01.',
  },
  {
    question: 'Which countries are supported?',
    answer: 'NexPay works in 100+ countries worldwide. As long as you have internet access and a device with fingerprint scanner, you can send and receive payments.',
  },
  {
    question: 'How fast are transactions?',
    answer: 'Transactions typically complete within 3-15 seconds. Unlike traditional bank transfers that take days, blockchain settlements are near-instant.',
  },
  {
    question: 'Is my money safe?',
    answer: 'Absolutely. Your funds are secured by military-grade encryption and stored on the Ethereum blockchain. Only you can access your wallet using your unique biometric signature.',
  },
  {
    question: 'What is KYC and do I need it?',
    answer: 'KYC (Know Your Customer) is optional verification that increases your transaction limits. Basic accounts work without KYC, but verified accounts enjoy higher limits and merchant features.',
  },
  {
    question: 'Can I use NexPay for my business?',
    answer: 'Yes! Register as a business to accept payments, get listed in our merchant directory, and access detailed transaction analytics and invoicing features.',
  },
];

const FAQ: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <HelpCircle className="w-5 h-5 text-primary" />
        </div>
        <h3 className="text-xl font-display font-bold text-foreground">
          Frequently Asked Questions
        </h3>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {faqs.map((faq, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.05 }}
          >
            <AccordionItem
              value={`item-${index}`}
              className="glass rounded-xl px-4 border-none"
            >
              <AccordionTrigger className="text-left text-foreground hover:no-underline py-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          </motion.div>
        ))}
      </Accordion>
    </motion.div>
  );
};

export default FAQ;
