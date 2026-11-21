import { ExperimentOutlined, ReloadOutlined } from "@ant-design/icons";
import { App, Button, Card, ColorPicker, Col, Divider, Flex, Form, Popconfirm, Radio, Row, Slider, Switch, Typography } from "antd";
import { DEFAULT_SETTINGS, useStore } from "../store.tsx";

const PRESETS = ["#1677ff", "#722ed1", "#13c2c2", "#eb2f96", "#fa541c", "#52c41a", "#2f54eb", "#faad14"];

export default function Settings({ onTour }: { onTour: () => void }) {
  const { state, dispatch } = useStore();
  const { message } = App.useApp();
  const s = state.settings;
  const set = (patch: Partial<typeof s>) => dispatch({ type: "settings", patch });

  return (
    <Flex vertical gap={16} style={{ maxWidth: 900 }}>
      <Typography.Title level={3} style={{ margin: 0 }}>Settings</Typography.Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Look and feel">
            <Form layout="vertical">
              <Form.Item label="Theme">
                <Radio.Group value={s.dark ? "dark" : "light"} onChange={(e) => set({ dark: e.target.value === "dark" })}
                  optionType="button" buttonStyle="solid" options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} />
              </Form.Item>
              <Form.Item label="Compact spacing" extra="Ant Design's compact algorithm: smaller controls and gaps.">
                <Switch checked={s.compact} onChange={(compact) => set({ compact })} />
              </Form.Item>
              <Form.Item label="Brand colour" extra="Every component follows this one token.">
                <ColorPicker value={s.primary} onChangeComplete={(c) => set({ primary: c.toHexString() })} showText
                  presets={[{ label: "Presets", colors: PRESETS }]} disabledAlpha />
              </Form.Item>
              <Form.Item label={`Corner radius: ${s.radius}px`}>
                <Slider min={0} max={16} value={s.radius} onChange={(radius) => set({ radius })} marks={{ 0: "0", 8: "8", 16: "16" }} />
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Language and extras">
            <Form layout="vertical">
              <Form.Item label="Component language" extra="Switches Ant Design's built-in texts and dates (pagination, pickers, calendar). Page text stays in English.">
                <Radio.Group value={s.locale} onChange={(e) => set({ locale: e.target.value })}
                  options={[{ value: "en", label: "English" }, { value: "hi", label: "हिन्दी (Hindi)" }]} />
              </Form.Item>
              <Form.Item label="Watermark" extra='Marks every page "postdeck · sample data", like an internal tool.'>
                <Switch checked={s.watermark} onChange={(watermark) => set({ watermark })} />
              </Form.Item>
              <Form.Item label="Guided tour">
                <Button icon={<ExperimentOutlined />} onClick={onTour}>Start the tour</Button>
              </Form.Item>
              <Button onClick={() => { set({ ...DEFAULT_SETTINGS, siderCollapsed: s.siderCollapsed }); message.success("Settings reset"); }}>Reset look and feel</Button>
            </Form>
          </Card>
        </Col>
      </Row>
      <Card title="Sample data">
        <Typography.Paragraph>
          {state.posts.length} posts and {state.authors.length} authors, generated with faker from seed <Typography.Text code>{state.seed}</Typography.Text>.
          Your edits are saved in this browser only.
        </Typography.Paragraph>
        <Divider style={{ margin: "12px 0" }} />
        <Flex gap={8} wrap>
          <Popconfirm title="Reset to the original data?" description="Your edits will be lost." onConfirm={() => { dispatch({ type: "regenerate", seed: 42 }); message.success("Data reset"); }}>
            <Button icon={<ReloadOutlined />}>Reset data</Button>
          </Popconfirm>
          <Popconfirm title="Generate new random data?" description="Your edits will be lost." onConfirm={() => {
            const seed = Math.floor(Math.random() * 100_000);
            dispatch({ type: "regenerate", seed });
            message.success(`New data from seed ${seed}`);
          }}>
            <Button type="primary" icon={<ExperimentOutlined />}>Regenerate random data</Button>
          </Popconfirm>
        </Flex>
      </Card>
    </Flex>
  );
}
