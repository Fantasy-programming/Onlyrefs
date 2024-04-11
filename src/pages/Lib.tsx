import { Button } from '~/components/ui/button';
import { Component } from 'solid-js';

const Debug: Component = () => {
  return (
    <div class="flex space-x-4  p-10">
      <div class="flex flex-col space-y-3">
        <h2 class="text-lg underline decoration-wavy underline-offset-4">
          Buttons
        </h2>
        <Button variant="primary">Primary Button </Button>
        <Button variant="secondary">Secondary Button </Button>
        <Button variant="outline">Outline Button </Button>
        <Button variant="ghost">Ghost Button </Button>
        <Button variant="destructive">Destructive Button</Button>
      </div>
    </div>
  );
};

export default Debug;
