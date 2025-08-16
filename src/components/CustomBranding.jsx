
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Palette, Image, PaintBucket, Trash, Save, Eye } from 'lucide-react';

export const CustomBranding = () => {
  const [brandingSettings, setBrandingSettings] = useState({
    logo: null,
    logoUrl: '',
    colors: {
      primary: '#8B5CF6',
      secondary: '#D946EF',
      background: '#FFFFFF',
      text: '#333333',
    },
    customText: {
      pageTitle: 'ShareT - Shared with you',
      welcomeMessage: 'Welcome to this shared content',
      footerText: '© 2023 Your Company',
    },
    options: {
      showLogo: true,
      showFooter: true,
      showCreator: true,
      useCustomFont: false,
    }
  });

  const [logoPreview, setLogoPreview] = useState(null);
  
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setBrandingSettings({
        ...brandingSettings,
        logo: file
      });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      toast.success('Logo uploaded successfully');
    }
  };
  
  const handleColorChange = (colorKey, value) => {
    setBrandingSettings({
      ...brandingSettings,
      colors: {
        ...brandingSettings.colors,
        [colorKey]: value
      }
    });
  };
  
  const handleTextChange = (textKey, value) => {
    setBrandingSettings({
      ...brandingSettings,
      customText: {
        ...brandingSettings.customText,
        [textKey]: value
      }
    });
  };
  
  const handleOptionChange = (key, value) => {
    setBrandingSettings({
      ...brandingSettings,
      options: {
        ...brandingSettings.options,
        [key]: value
      }
    });
  };
  
  const removeLogo = () => {
    setBrandingSettings({
      ...brandingSettings,
      logo: null
    });
    setLogoPreview(null);
    toast.success('Logo removed');
  };
  
  const previewBranding = () => {
    toast.success('Opening branding preview in a new tab');
    // In a real app, this would open a preview window
  };
  
  const saveBrandingSettings = () => {
    // In a real app, this would save to an API
    toast.success('Branding settings saved successfully');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Custom Branding</h2>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={previewBranding}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={saveBrandingSettings}>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="logos" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="logos">
            <Image className="mr-2 h-4 w-4" />
            Logo & Images
          </TabsTrigger>
          <TabsTrigger value="colors">
            <Palette className="mr-2 h-4 w-4" />
            Colors
          </TabsTrigger>
          <TabsTrigger value="text">
            <PaintBucket className="mr-2 h-4 w-4" />
            Text & Options
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="logos">
          <Card>
            <CardHeader>
              <CardTitle>Logo & Branding Images</CardTitle>
              <CardDescription>
                Upload and manage your branded images.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Custom Logo</h3>
                
                {logoPreview ? (
                  <div className="space-y-4">
                    <div className="border rounded-md p-4 flex items-center justify-center bg-muted/30">
                      <img 
                        src={logoPreview} 
                        alt="Logo Preview" 
                        className="max-h-32 max-w-full"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => document.getElementById('logo-upload').click()}>
                        Change Logo
                      </Button>
                      <Button variant="destructive" size="sm" onClick={removeLogo}>
                        <Trash className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-md p-8 border-dashed text-center space-y-4">
                    <div className="mx-auto w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center">
                      <Image className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        Drag and drop your logo here, or click to browse
                      </p>
                      <Button variant="outline" size="sm" onClick={() => document.getElementById('logo-upload').click()}>
                        Upload Logo
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Recommended: PNG or SVG, 400x100px
                    </p>
                  </div>
                )}
                
                <input 
                  id="logo-upload" 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoChange} 
                  style={{ display: 'none' }}
                />
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Remote Logo URL</h3>
                <p className="text-sm text-muted-foreground">
                  Alternatively, you can use a logo from a remote URL
                </p>
                
                <div className="space-y-2">
                  <Label htmlFor="logo-url">Logo URL</Label>
                  <Input 
                    id="logo-url" 
                    type="url" 
                    placeholder="https://example.com/logo.png"
                    value={brandingSettings.logoUrl}
                    onChange={(e) => setBrandingSettings({...brandingSettings, logoUrl: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle>Brand Colors</CardTitle>
              <CardDescription>
                Customize the colors used in shared content.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="primary-color">Primary Color</Label>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-8 h-8 rounded-full border"
                        style={{ backgroundColor: brandingSettings.colors.primary }}
                      />
                      <Input 
                        id="primary-color" 
                        value={brandingSettings.colors.primary}
                        onChange={(e) => handleColorChange('primary', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="secondary-color">Secondary Color</Label>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-8 h-8 rounded-full border"
                        style={{ backgroundColor: brandingSettings.colors.secondary }}
                      />
                      <Input 
                        id="secondary-color" 
                        value={brandingSettings.colors.secondary}
                        onChange={(e) => handleColorChange('secondary', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="background-color">Background Color</Label>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-8 h-8 rounded-full border"
                        style={{ backgroundColor: brandingSettings.colors.background }}
                      />
                      <Input 
                        id="background-color" 
                        value={brandingSettings.colors.background}
                        onChange={(e) => handleColorChange('background', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="text-color">Text Color</Label>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-8 h-8 rounded-full border"
                        style={{ backgroundColor: brandingSettings.colors.text }}
                      />
                      <Input 
                        id="text-color" 
                        value={brandingSettings.colors.text}
                        onChange={(e) => handleColorChange('text', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-6 border-t mt-6">
                <h3 className="font-medium mb-4">Color Preview</h3>
                <div 
                  className="p-6 rounded-md border shadow-sm"
                  style={{ backgroundColor: brandingSettings.colors.background }}
                >
                  <div className="space-y-4">
                    <h4 
                      className="text-xl font-bold"
                      style={{ color: brandingSettings.colors.text }}
                    >
                      Example Heading
                    </h4>
                    <p 
                      className="text-sm"
                      style={{ color: brandingSettings.colors.text }}
                    >
                      This is an example of how your text will look with the selected colors.
                    </p>
                    <div className="flex space-x-2">
                      <Button 
                        style={{ 
                          backgroundColor: brandingSettings.colors.primary,
                          color: 'white',
                          border: 'none' 
                        }}
                      >
                        Primary Button
                      </Button>
                      <Button 
                        variant="outline"
                        style={{ 
                          color: brandingSettings.colors.secondary,
                          borderColor: brandingSettings.colors.secondary,
                          backgroundColor: 'transparent'
                        }}
                      >
                        Secondary Button
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="text">
          <Card>
            <CardHeader>
              <CardTitle>Custom Text & Options</CardTitle>
              <CardDescription>
                Customize text and display options for shared content.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Custom Text</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="page-title">Page Title</Label>
                  <Input 
                    id="page-title" 
                    value={brandingSettings.customText.pageTitle}
                    onChange={(e) => handleTextChange('pageTitle', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This appears in the browser tab and as the main heading
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="welcome-message">Welcome Message</Label>
                  <Textarea
                    id="welcome-message"
                    value={brandingSettings.customText.welcomeMessage}
                    onChange={(e) => handleTextChange('welcomeMessage', e.target.value)}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    This appears at the top of shared content
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="footer-text">Footer Text</Label>
                  <Input 
                    id="footer-text" 
                    value={brandingSettings.customText.footerText}
                    onChange={(e) => handleTextChange('footerText', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    This appears at the bottom of shared content
                  </p>
                </div>
              </div>
              
              <div className="space-y-4 pt-6 border-t">
                <h3 className="font-medium">Display Options</h3>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-logo" className="flex flex-col space-y-1">
                    <span>Show Logo</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      Display your logo on shared content
                    </span>
                  </Label>
                  <Switch 
                    id="show-logo" 
                    checked={brandingSettings.options.showLogo}
                    onCheckedChange={(checked) => handleOptionChange('showLogo', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-footer" className="flex flex-col space-y-1">
                    <span>Show Footer</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      Display footer with customizable text
                    </span>
                  </Label>
                  <Switch 
                    id="show-footer" 
                    checked={brandingSettings.options.showFooter}
                    onCheckedChange={(checked) => handleOptionChange('showFooter', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-creator" className="flex flex-col space-y-1">
                    <span>Show Creator</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      Show who created the shared content
                    </span>
                  </Label>
                  <Switch 
                    id="show-creator" 
                    checked={brandingSettings.options.showCreator}
                    onCheckedChange={(checked) => handleOptionChange('showCreator', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="use-custom-font" className="flex flex-col space-y-1">
                    <span>Use Custom Font</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      Use your brand&apos;s custom font (Pro feature)
                    </span>
                  </Label>
                  <Switch 
                    id="use-custom-font" 
                    checked={brandingSettings.options.useCustomFont}
                    onCheckedChange={(checked) => handleOptionChange('useCustomFont', checked)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={saveBrandingSettings} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Save Branding Settings
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
