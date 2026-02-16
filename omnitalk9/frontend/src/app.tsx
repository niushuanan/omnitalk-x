import RootRouter from '@routes/root.tsx';
import GlobalConfig from '@components/global-config';
import Header from '@/layout/header/header.tsx';
import './styles/index.less';
import 'sea-lion-ui/dist/index.css';

const App = () => {
    return (
        <GlobalConfig>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Header />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <RootRouter />
                </div>
            </div>
        </GlobalConfig>
    );
};

export default App;
