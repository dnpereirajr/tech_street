import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Heart, Coffee, Zap, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function DonationButton() {
  const { toast } = useToast();

  const donationOptions = [
    {
      platform: 'PIX',
      title: 'PIX (Brasil)',
      description: 'Doação rápida via PIX',
      icon: <Zap className="w-5 h-5" />,
      action: () => {
        // Substitua pela sua chave PIX real
        navigator.clipboard.writeText('contato@streettech.com.br');
        toast({
          title: "Chave PIX copiada!",
          description: "Chave PIX copiada para área de transferência",
        });
      }
    },
    {
      platform: 'Ko-fi',
      title: 'Buy me a coffee',
      description: 'Apoie com Ko-fi',
      icon: <Coffee className="w-5 h-5" />,
      action: () => {
        window.open('https://ko-fi.com/streettech', '_blank');
      }
    },
    {
      platform: 'PayPal',
      title: 'PayPal',
      description: 'Doação internacional',
      icon: <Heart className="w-5 h-5" />,
      action: () => {
        window.open('https://paypal.me/streettech', '_blank');
      }
    }
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Heart className="w-4 h-4 text-red-500" />
          Apoiar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Apoiar o Desenvolvimento
          </DialogTitle>
          <DialogDescription>
            Ajude a manter este projeto gratuito e em constante desenvolvimento!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {donationOptions.map((option) => (
            <Card key={option.platform} className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {option.icon}
                    <div>
                      <div className="font-medium">{option.title}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={option.action}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Por que apoiar?</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Mantém o app gratuito para todos</li>
                <li>• Financia servidores e desenvolvimento</li>
                <li>• Permite novas funcionalidades</li>
                <li>• Suporte técnico prioritário</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}