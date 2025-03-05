
import { useState, useEffect, useRef } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export const ColorPicker = ({ value, onChange }) => {
  const [color, setColor] = useState(value || '#000000');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  
  useEffect(() => {
    if (value !== color) {
      setColor(value);
    }
  }, [value]);
  
  const handleChange = (e) => {
    const newColor = e.target.value;
    setColor(newColor);
    onChange(newColor);
  };
  
  const handleInputChange = (e) => {
    let newColor = e.target.value;
    
    // Add # if missing
    if (newColor.length > 0 && !newColor.startsWith('#')) {
      newColor = `#${newColor}`;
    }
    
    // Validate hex color
    if (/^#([0-9A-F]{3}){1,2}$/i.test(newColor) || newColor === '#') {
      setColor(newColor);
      if (newColor !== '#') {
        onChange(newColor);
      }
    }
  };
  
  const openColorPicker = () => {
    setIsOpen(true);
    // Focus and click the input to open the native color picker
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.click();
      }
    }, 100);
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          className="w-10 h-10 rounded-md border cursor-pointer"
          style={{ backgroundColor: color }}
          onClick={openColorPicker}
        />
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div>
            <div className="flex space-x-2 items-center">
              <input
                ref={inputRef}
                type="color"
                value={color}
                onChange={handleChange}
                className="w-8 h-8 rounded overflow-hidden cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={handleInputChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="#000000"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-8 gap-1">
            {['#F44336', '#E91E63', '#9C27B0', '#673AB7', 
              '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
              '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
              '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
              '#795548', '#9E9E9E', '#607D8B', '#000000',
              '#FFFFFF'].map((presetColor) => (
              <div
                key={presetColor}
                className="w-6 h-6 rounded-md cursor-pointer border"
                style={{ backgroundColor: presetColor }}
                onClick={() => {
                  setColor(presetColor);
                  onChange(presetColor);
                  setIsOpen(false);
                }}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
