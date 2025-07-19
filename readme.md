========== CREDITS ==========
Created By: Devan Yudistira Sugiharta
Framework Name: Harmonia
Licensed: No License

========== SERVER RUNNING ==========
- Auto local server work on `http://localhost:2000`

========== COMPONENTS USAGE ==========

How to use components in your HTML:

- To include a component file:
  ```html
  <vortex/>
  ```
  This will include the content of `vortex.html`.

- To use a component with content slot:
  ```html
  <vortex>
    Your content here
  </vortex>
  ```
  This will include `vortex.html` and replace `<h:slot>` inside it with your content.

- To use a layout from a subfolder:
  ```html
  <layout.main>
    Page content here
  </layout.main>
  ```
  This will include `layout/main.html` and inject your content into `<h:slot>`.
  
Just write these tags in your HTML file. The server will process and render them automatically.