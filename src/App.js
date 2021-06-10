// Modules;
import React, {Suspense} from 'react';
import LazyLoad from 'react-lazyload';
import {BrowserRouter as Router, Switch, Route} from "react-router-dom";

// Components
// import Splash from './pages/Splash.js';
// import Chat from './pages/Chat.js';
// import Legal from './pages/Legal.js';
// import Terms from './pages/legal/Terms.js';
// import Privacy from './pages/legal/Privacy.js';
import Loading from './Components/Loading';
import Store from './Components/Store'

const Splash = React.lazy(() => import ('./pages/Splash.js'))
const Chat = React.lazy(() => import ('./pages/Chat.js'))
const Legal = React.lazy(() => import ('./pages/Legal.js'))
const Terms = React.lazy(() => import ('./pages/Terms.js'))
const Privacy = React.lazy(() => import ('./pages/Privacy.js'))
// const Splash = React.lazy(() => import('./pages/Splash.js'))


class App extends React.Component {

    render() {
        return (
            <LazyLoad>
                <Suspense fallback={Loading}>
                    <Router>
                        <Store>
                            <div className="App">
                                <Switch>
                                    <Route exact path="/"
                                        component={Splash}/>
                                    <Route path="/chat"
                                        component={Chat}/>
                                    <Route exact path="/legal"
                                        component={Legal}/>
                                    <Route path="/terms"
                                        component={Terms}/>
                                    <Route path="/privacy"
                                        component={Privacy}/>
                                </Switch>
                            </div>
                        </Store>
                    </Router>
                </Suspense>
            </LazyLoad>
        )
    }
}

export default App;
