 #!/usr/bin/python3
from i3ipc import Connection, Event

i3 = Connection()


class ConkyState(object):
    is_conky_shown = False


def init_conky_windows():
    i3.command('for_window [class="conky"] sticky enable; [class="conky"] no_focus')
    hide_conky()

def hide_conky():
    i3.command('[class="conky"] move scratchpad')
    ConkyState.is_conky_shown = False
    print("Conky Hidden")
    

def clean_show_conky():
    if ConkyState.is_conky_shown:
        print("Conky already shown, rehiding to show again")
        hide_conky()
    show_conky()

def show_conky():
    i3.command('[class="conky"] scratchpad show; [class="conky"] sticky enable; no_focus [class="conky"];')
    ConkyState.is_conky_shown = True
    print("Conky shown")

def refresh_visiblity(ws):
    if ws:
        if len(ws.leaves()) == 0:
            clean_show_conky()
            return True
        else:
            hide_conky()
            return False

def on_workspace_focus(self, e):
    refresh_visiblity(e.current)
        
    
def on_window_focus(i3, e):
    if not ConkyState.is_conky_shown:
        return
    focused = i3.get_tree().find_focused()
    if focused.window_class != 'conky':
        refresh_visiblity(focused.workspace())
        print(focused.window_class)

i3.on(Event.WORKSPACE_FOCUS, on_workspace_focus)
i3.on(Event.WINDOW_FOCUS, on_window_focus)

init_conky_windows()
i3.main()
