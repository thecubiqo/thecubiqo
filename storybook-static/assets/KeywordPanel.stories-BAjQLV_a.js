import{K as o}from"./KeywordPanel-D2TfcsMS.js";import"./jsx-runtime-C5WNSv3b.js";import"./index-ukwzBNUP.js";const i={title:"Components/KeywordPanel",component:o,parameters:{layout:"fullscreen",backgrounds:{default:"dark",values:[{name:"dark",value:"#000000"},{name:"light",value:"#ffffff"}]}},tags:["autodocs"],argTypes:{isOpen:{control:"boolean",description:"Whether the panel is open"},isDark:{control:"boolean",description:"Whether to use a dark theme variant"},onClose:{action:"panel closed"}}},s={args:{isOpen:!1,isDark:!0,sessionId:"storybook-session"}},e={args:{isOpen:!0,isDark:!0,sessionId:"storybook-session"}},r={args:{isOpen:!0,isDark:!1,sessionId:"storybook-session"},parameters:{backgrounds:{default:"light"}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    isOpen: false,
    isDark: true,
    sessionId: 'storybook-session'
  }
}`,...s.parameters?.docs?.source}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    isOpen: true,
    isDark: true,
    sessionId: 'storybook-session'
  }
}`,...e.parameters?.docs?.source}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    isOpen: true,
    isDark: false,
    sessionId: 'storybook-session'
  },
  parameters: {
    backgrounds: {
      default: 'light'
    }
  }
}`,...r.parameters?.docs?.source}}};const p=["Closed","Open","OpenLightTheme"];export{s as Closed,e as Open,r as OpenLightTheme,p as __namedExportsOrder,i as default};
