import{G as n}from"./GettingStartedPanel-DPsKNN3d.js";import"./jsx-runtime-C5WNSv3b.js";import"./index-ukwzBNUP.js";import"./MagicLinkButtons-C3ey5Sl3.js";import"./base64url-YC0aElVo.js";const m={title:"Components/GettingStartedPanel",component:n,parameters:{layout:"fullscreen",backgrounds:{default:"dark",values:[{name:"dark",value:"#000000"},{name:"light",value:"#ffffff"}]}},tags:["autodocs"],argTypes:{isOpen:{control:"boolean",description:"Whether the panel is open"},isDark:{control:"boolean",description:"Whether to use a dark theme variant"},onClose:{action:"panel closed"},onExampleClick:{action:"example clicked"}}},e={args:{isOpen:!1,isDark:!0}},a={args:{isOpen:!0,isDark:!0}},r={args:{isOpen:!0,isDark:!1},parameters:{backgrounds:{default:"light"}}},s={args:{isOpen:!0,isDark:!0,onExampleClick:t=>console.log("Example clicked:",t)}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    isOpen: false,
    isDark: true
  }
}`,...e.parameters?.docs?.source}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    isOpen: true,
    isDark: true
  }
}`,...a.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    isOpen: true,
    isDark: false
  },
  parameters: {
    backgrounds: {
      default: 'light'
    }
  }
}`,...r.parameters?.docs?.source}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    isOpen: true,
    isDark: true,
    onExampleClick: text => console.log('Example clicked:', text)
  }
}`,...s.parameters?.docs?.source}}};const u=["Closed","Open","OpenLightTheme","WithExampleCallback"];export{e as Closed,a as Open,r as OpenLightTheme,s as WithExampleCallback,u as __namedExportsOrder,m as default};
